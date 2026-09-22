/**
 * localStorage 封装：安全读写 + 过期时间
 */
const storage = {
  /**
   * 写入（可带过期时间，单位 ms）
   */
  set(key, value, expireMs) {
    try {
      const payload = {
        value,
        expireAt: expireMs ? Date.now() + expireMs : null,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      // 存储不可用时静默失败
    }
  },

  /**
   * 读取，过期自动清除并返回 null
   */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (payload.expireAt && Date.now() > payload.expireAt) {
        localStorage.removeItem(key);
        return null;
      }
      return payload.value;
    } catch {
      return null;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export default storage;
