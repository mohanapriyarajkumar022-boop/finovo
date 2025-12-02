// Central API base configuration
const API_BASE = process.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'development' ? 'https://finovo.techvaseegrah.com' : window.location.origin);

export default API_BASE;