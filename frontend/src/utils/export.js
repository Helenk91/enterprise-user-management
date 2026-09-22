/**
 * 数据导出工具
 * 浏览器端生成 CSV 并触发下载
 */

/**
 * 导出为 CSV 文件
 * @param {Array<Object>} rows 数据行
 * @param {Object} headers 列头映射 { field: 表头 }
 * @param {string} filename 文件名（不含扩展名）
 */
export function exportToCsv(rows, headers, filename = 'export') {
  if (!rows || !rows.length) {
    return { ok: false, message: '没有可导出的数据' }
  }

  const fields = Object.keys(headers)
  const esc = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const lines = []
  lines.push(fields.map((f) => esc(headers[f])).join(','))
  for (const row of rows) {
    lines.push(fields.map((f) => esc(row[f])).join(','))
  }

  // 添加 BOM 以兼容 Excel 中文
  const content = '\uFEFF' + lines.join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `${filename}.csv`)
  return { ok: true, count: rows.length }
}

/**
 * 通用 Blob 下载
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * 导出为 JSON 文件
 */
export function exportToJson(data, filename = 'export') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  downloadBlob(blob, `${filename}.json`)
  return { ok: true }
}

/**
 * 复制文本到剪贴板
 */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return { ok: true }
    }
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e.message }
  }
}

/**
 * 时间戳文件名
 */
export function timestampName(prefix) {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${prefix}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}
