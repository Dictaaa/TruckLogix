// Reglas del módulo de Facturación.
// Funciones puras: reciben los viajes ya cargados y devuelven errores (bloquean)
// y advertencias (requieren que el usuario confirme). No tocan la base de datos.

const STATUS = {
    PEND_TEMP: 'pendiente_oc_temporal',
    PEND_OC:   'pendiente_oc',
    PEND_FACT: 'pendiente_factura',
    FACTURADO: 'facturado',
};

const STATUS_LABELS = {
    [STATUS.PEND_TEMP]: 'Pendiente OC temporal',
    [STATUS.PEND_OC]:   'Pendiente orden de compra',
    [STATUS.PEND_FACT]: 'Pendiente factura',
    [STATUS.FACTURADO]: 'Facturado',
};

const TEMP_PREFIX = 'OCTEMP';
const tempCode = (id) => `${TEMP_PREFIX}${String(id).padStart(5, '0')}`;

/** El estado sale de lo que tenga el viaje */
const computeStatus = (t) => {
    if (t.invoice_number) return STATUS.FACTURADO;
    if (t.purchase_order) return STATUS.PEND_FACT;
    if (t.temp_order_id)  return STATUS.PEND_OC;
    return STATUS.PEND_TEMP;
};

const clean = (v) => (v === null || v === undefined ? '' : String(v).trim());
const sameText = (a, b) => clean(a).toUpperCase() === clean(b).toUpperCase();

/** Resumen de un viaje para mostrar en alertas */
const tripRef = (t, ctx = {}) => ({
    id: t.id,
    trip_date: t.trip_date,
    plate: ctx.plates?.[t.vehicle_id] ?? null,
    container: ctx.containers?.[t.container_id] ?? null,
    freight_value: Number(t.freight_value || 0),
    temp_order: t.temp_order_id ? (ctx.tempCodes?.[t.temp_order_id] ?? tempCode(t.temp_order_id)) : null,
    purchase_order: t.purchase_order || null,
    invoice_number: t.invoice_number || null,
});

/** Agrupa los viajes por un valor y cuenta (ignora vacíos) */
const groupBy = (trips, getKey) => {
    const map = new Map();
    trips.forEach(t => {
        const k = getKey(t);
        if (k === null || k === undefined || k === '') return;
        map.set(k, (map.get(k) || 0) + 1);
    });
    return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
};

// ─── 1. GENERAR OC TEMPORAL ──────────────────────────────────────────────────
const analyzeTempOrder = (trips, ctx = {}) => {
    const errors = [];
    const warnings = [];

    const advanced = trips.filter(t => t.purchase_order || t.invoice_number);
    if (advanced.length) {
        errors.push({
            code: 'YA_TIENE_OC',
            message: `${advanced.length} viaje(s) ya tienen orden de compra o factura; no se les puede generar OC temporal.`,
            trips: advanced.map(t => tripRef(t, ctx)),
        });
    }

    const withTemp = trips.filter(t => t.temp_order_id && !t.purchase_order && !t.invoice_number);
    if (withTemp.length) {
        const groups = groupBy(withTemp, t => t.temp_order_id)
            .map(g => ({ temp_order_id: g.key, code: ctx.tempCodes?.[g.key] ?? tempCode(g.key), count: g.count }));
        warnings.push({
            code: 'YA_TIENE_OC_TEMPORAL',
            message: `${withTemp.length} viaje(s) ya tienen OC temporal (${groups.map(g => g.code).join(', ')}). Si continúas, pasarán a la nueva OC temporal.`,
            groups,
            trips: withTemp.map(t => tripRef(t, ctx)),
        });
    }

    return { errors, warnings };
};

// ─── 2. ASIGNAR ORDEN DE COMPRA ──────────────────────────────────────────────
/**
 * @param trips          viajes seleccionados
 * @param purchaseOrder  OC que digitó el usuario
 * @param opts.tempOrderId  OC temporal que eligió el usuario (opcional)
 * @param opts.duplicateCount  # de viajes NO seleccionados que ya usan esa OC
 */
const analyzePurchaseOrder = (trips, purchaseOrder, opts = {}, ctx = {}) => {
    const errors = [];
    const warnings = [];
    const po = clean(purchaseOrder);

    if (!po) errors.push({ code: 'OC_REQUERIDA', message: 'Debes ingresar el número de orden de compra.' });
    if (po.length > 60) errors.push({ code: 'OC_LARGA', message: 'La orden de compra no puede tener más de 60 caracteres.' });

    const invoiced = trips.filter(t => t.invoice_number);
    if (invoiced.length) {
        errors.push({
            code: 'YA_FACTURADO',
            message: `${invoiced.length} viaje(s) ya están facturados. Revierte la factura antes de cambiar la orden de compra.`,
            trips: invoiced.map(t => tripRef(t, ctx)),
        });
    }

    // OC temporal destino: la que eligió el usuario o la del grupo mayoritario
    const tempGroups = groupBy(trips, t => t.temp_order_id);
    let targetTempId = opts.tempOrderId ? Number(opts.tempOrderId) : (tempGroups[0]?.key ?? null);
    if (opts.tempOrderId && !tempGroups.some(g => Number(g.key) === targetTempId) && !opts.tempOrderExists) {
        errors.push({ code: 'OC_TEMPORAL_INVALIDA', message: 'La OC temporal indicada no existe.' });
    }
    const codeOf = (id) => ctx.tempCodes?.[id] ?? tempCode(id);

    const withoutTemp = trips.filter(t => !t.temp_order_id);
    if (withoutTemp.length) {
        warnings.push({
            code: 'SIN_OC_TEMPORAL',
            message: targetTempId
                ? `${withoutTemp.length} viaje(s) no tienen OC temporal. Si continúas, se les asignará ${codeOf(targetTempId)}.`
                : `Ninguno de los viajes tiene OC temporal. Si continúas, se generará una nueva OC temporal para todos.`,
            trips: withoutTemp.map(t => tripRef(t, ctx)),
        });
    }

    const differentTemp = targetTempId
        ? trips.filter(t => t.temp_order_id && Number(t.temp_order_id) !== targetTempId)
        : [];
    if (differentTemp.length) {
        const groups = groupBy(differentTemp, t => t.temp_order_id)
            .map(g => ({ temp_order_id: g.key, code: codeOf(g.key), count: g.count }));
        warnings.push({
            code: 'OC_TEMPORAL_DIFERENTE',
            message: `${differentTemp.length} viaje(s) tienen una OC temporal diferente (${groups.map(g => g.code).join(', ')}). Si continúas, quedarán con ${codeOf(targetTempId)}.`,
            groups,
            trips: differentTemp.map(t => tripRef(t, ctx)),
        });
    }

    const otherPo = trips.filter(t => t.purchase_order && !t.invoice_number && !sameText(t.purchase_order, po));
    if (po && otherPo.length) {
        warnings.push({
            code: 'YA_TIENE_OC',
            message: `${otherPo.length} viaje(s) ya tienen otra orden de compra. Si continúas, se reemplazará por ${po}.`,
            trips: otherPo.map(t => tripRef(t, ctx)),
        });
    }

    if (po && opts.duplicateCount > 0) {
        warnings.push({
            code: 'OC_YA_USADA',
            message: `La orden de compra ${po} ya está asignada a ${opts.duplicateCount} viaje(s) que no seleccionaste.`,
        });
    }

    return {
        errors,
        warnings,
        target: {
            temp_order_id: targetTempId,
            temp_order_code: targetTempId ? codeOf(targetTempId) : null,
            create_temp_order: !targetTempId,
            purchase_order: po,
        },
    };
};

// ─── 3. ASIGNAR FACTURA ──────────────────────────────────────────────────────
const analyzeInvoice = (trips, invoiceNumber, opts = {}, ctx = {}) => {
    const errors = [];
    const warnings = [];
    const inv = clean(invoiceNumber);

    if (!inv) errors.push({ code: 'FACTURA_REQUERIDA', message: 'Debes ingresar el número de factura.' });
    if (inv.length > 60) errors.push({ code: 'FACTURA_LARGA', message: 'La factura no puede tener más de 60 caracteres.' });

    const otherInvoice = trips.filter(t => t.invoice_number && !sameText(t.invoice_number, inv));
    if (inv && otherInvoice.length) {
        errors.push({
            code: 'YA_FACTURADO',
            message: `${otherInvoice.length} viaje(s) ya tienen otra factura. Revierte la factura antes de asignar una nueva.`,
            trips: otherInvoice.map(t => tripRef(t, ctx)),
        });
    }

    const withoutPo = trips.filter(t => !t.purchase_order);
    if (withoutPo.length) {
        warnings.push({
            code: 'SIN_OC',
            message: `${withoutPo.length} viaje(s) no tienen orden de compra. ¿Deseas facturarlos de todas formas?`,
            trips: withoutPo.map(t => tripRef(t, ctx)),
        });
    }

    const poGroups = groupBy(trips, t => clean(t.purchase_order).toUpperCase() || null);
    if (poGroups.length > 1) {
        warnings.push({
            code: 'OC_DIFERENTES',
            message: `Los viajes seleccionados tienen ${poGroups.length} órdenes de compra diferentes (${poGroups.map(g => g.key).join(', ')}).`,
            groups: poGroups.map(g => ({ purchase_order: g.key, count: g.count })),
        });
    }

    if (inv && opts.duplicateCount > 0) {
        warnings.push({
            code: 'FACTURA_YA_USADA',
            message: `La factura ${inv} ya está asignada a ${opts.duplicateCount} viaje(s) que no seleccionaste.`,
        });
    }

    return { errors, warnings, target: { invoice_number: inv } };
};

// ─── 4. REVERTIR UN PASO ─────────────────────────────────────────────────────
const REVERT_STEPS = {
    invoice:        { fields: { invoice_number: null, invoice_date: null, invoice_at: null }, needs: 'invoice_number' },
    purchase_order: { fields: { purchase_order: null, purchase_order_at: null },              needs: 'purchase_order' },
    temp_order:     { fields: { temp_order_id: null, temp_order_at: null },                   needs: 'temp_order_id' },
};

const analyzeRevert = (trips, step, ctx = {}) => {
    const errors = [];
    const cfg = REVERT_STEPS[step];
    if (!cfg) return { errors: [{ code: 'PASO_INVALIDO', message: 'Paso inválido.' }], warnings: [] };

    const without = trips.filter(t => !t[cfg.needs]);
    if (without.length) {
        errors.push({ code: 'NADA_QUE_REVERTIR', message: `${without.length} viaje(s) no tienen ese dato para revertir.`, trips: without.map(t => tripRef(t, ctx)) });
    }
    // No se puede quitar un paso si hay uno posterior
    if (step === 'purchase_order') {
        const inv = trips.filter(t => t.invoice_number);
        if (inv.length) errors.push({ code: 'TIENE_FACTURA', message: `${inv.length} viaje(s) tienen factura; revierte primero la factura.`, trips: inv.map(t => tripRef(t, ctx)) });
    }
    if (step === 'temp_order') {
        const po = trips.filter(t => t.purchase_order || t.invoice_number);
        if (po.length) errors.push({ code: 'TIENE_OC', message: `${po.length} viaje(s) tienen orden de compra o factura; revierte primero esos pasos.`, trips: po.map(t => tripRef(t, ctx)) });
    }
    return { errors, warnings: [] };
};

module.exports = {
    STATUS, STATUS_LABELS, TEMP_PREFIX, REVERT_STEPS,
    tempCode, computeStatus, clean,
    analyzeTempOrder, analyzePurchaseOrder, analyzeInvoice, analyzeRevert,
};