/**
 * 文件管理服务（虚拟文件系统）
 */
const { query, queryOne } = require('../db');

class FileService {
  /**
   * 文件夹树
   */
  async folders() {
    return query('SELECT id, name, parent_id FROM folders ORDER BY id');
  }

  /**
   * 某文件夹下的文件列表
   */
  async listFiles(folderId = 0, keyword = '') {
    let sql = 'SELECT * FROM files WHERE folder_id = ?';
    const params = [Number(folderId) || 0];
    if (keyword) {
      sql += ' AND name LIKE ?';
      params.push(`%${keyword}%`);
    }
    return query(`${sql} ORDER BY id DESC`, params);
  }

  /**
   * 统计（类型分布 + 总大小）
   */
  async stats() {
    const types = await query(
      `SELECT type AS name, COUNT(*) AS value, SUM(size) AS bytes FROM files GROUP BY type`
    );
    const [sizeRow] = await query('SELECT SUM(size) AS total FROM files');
    const [countRow] = await query('SELECT COUNT(*) AS cnt FROM files');
    return { types, totalBytes: sizeRow.total || 0, totalFiles: countRow.cnt };
  }

  /**
   * 创建文件夹
   */
  async createFolder(name, parentId = 0) {
    const result = await query('INSERT INTO folders (name, parent_id) VALUES (?, ?)', [
      name,
      Number(parentId) || 0,
    ]);
    return queryOne('SELECT * FROM folders WHERE id = ?', [result.insertId]);
  }

  /**
   * 记录文件
   */
  async createFile(data) {
    const ext = (data.name.match(/\.([a-zA-Z0-9]+)$/) || [])[1] || 'file';
    const type = this.guessType(ext);
    const result = await query(
      'INSERT INTO files (name, size, type, ext, folder_id, owner_id) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, Number(data.size) || 0, type, ext, Number(data.folderId) || 0, data.ownerId || 0]
    );
    return queryOne('SELECT * FROM files WHERE id = ?', [result.insertId]);
  }

  /**
   * 删除文件
   */
  async removeFile(id) {
    const result = await query('DELETE FROM files WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 删除文件夹（级联删子文件）
   */
  async removeFolder(id) {
    await query('DELETE FROM files WHERE folder_id = ?', [id]);
    const result = await query('DELETE FROM folders WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 下载计数
   */
  async bumpDownload(id) {
    await query('UPDATE files SET downloads = downloads + 1 WHERE id = ?', [id]);
  }

  guessType(ext) {
    const map = {
      png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image',
      mp4: 'video', avi: 'video', mov: 'video',
      mp3: 'audio', wav: 'audio',
      doc: 'doc', docx: 'doc', pdf: 'doc', xls: 'doc', xlsx: 'doc', ppt: 'doc', pptx: 'doc', txt: 'doc', md: 'doc',
    };
    return map[ext] || 'file';
  }
}

module.exports = new FileService();
