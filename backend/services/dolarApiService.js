const supabase = require('../config/supabaseClient');

const BCRA_URL          = 'https://api.bcra.gob.ar/estadisticas/v4.0/monetarias';
const DOLARAPI_OFICIAL  = 'https://dolarapi.com/v1/dolares/oficial';
const DOLARAPI_BLUE     = 'https://dolarapi.com/v1/dolares/blue';
const TIMEOUT_MS        = 6000;

class DolarApiService {
  async obtenerCotizacionDelDia() {
    const today = new Date().toISOString().split('T')[0];

    // Primero buscar en BD (cache del día)
    const { data: cached } = await supabase
      .from('cotizaciones_dolar')
      .select('*')
      .eq('fecha', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) return this._format(cached);

    // 1ª fuente: BCRA (valor único, sin separar compra/venta)
    try {
      const valor = await this._fetchBCRA();
      const saved = await this._save(today, 'BCRA', valor, valor, valor);
      return this._format(saved);
    } catch { /* fall through */ }

    // 2ª fuente: DolarAPI Oficial (compra y venta separados)
    try {
      const { compra, venta } = await this._fetchDolarAPI(DOLARAPI_OFICIAL);
      const saved = await this._save(today, 'DolarAPI Oficial', compra, venta, null);
      return this._format(saved);
    } catch { /* fall through */ }

    // 3ª fuente: DolarAPI Blue (último fallback)
    try {
      const { compra, venta } = await this._fetchDolarAPI(DOLARAPI_BLUE);
      const saved = await this._save(today, 'DolarAPI Blue', compra, venta, null);
      return this._format(saved);
    } catch { /* fall through */ }

    throw Object.assign(
      new Error('No se pudo obtener la cotización del dólar de ninguna fuente'),
      { status: 503 }
    );
  }

  async _fetchBCRA() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(BCRA_URL, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`BCRA HTTP ${res.status}`);
      const json = await res.json();
      const results = Array.isArray(json.results) ? json.results : [];
      const entry = results.find(r => {
        const desc = (r.descripcion || '').toLowerCase();
        return desc.includes('tipo de cambio') || r.idVariable === 4;
      });
      if (!entry?.valor) throw new Error('BCRA: no se encontró variable de tipo de cambio');
      return Number(entry.valor);
    } finally {
      clearTimeout(timer);
    }
  }

  async _fetchDolarAPI(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`DolarAPI HTTP ${res.status}`);
      const json = await res.json();
      const compra = Number(json.compra);
      const venta  = Number(json.venta);
      if (!compra || !venta) throw new Error('DolarAPI: datos de compra/venta incompletos');
      return { compra, venta };
    } finally {
      clearTimeout(timer);
    }
  }

  async _save(fecha, fuente, valor_compra, valor_venta, valor_unico) {
    const { data, error } = await supabase
      .from('cotizaciones_dolar')
      .insert([{ fecha, fuente, valor_compra, valor_venta, valor_unico }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  _format(row) {
    return {
      fecha:        row.fecha,
      fuente:       row.fuente,
      valor_compra: Number(row.valor_compra),
      valor_venta:  Number(row.valor_venta),
      valor_unico:  row.valor_unico ? Number(row.valor_unico) : null,
    };
  }
}

module.exports = new DolarApiService();
