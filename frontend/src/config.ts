// Configuration management for the application
interface Config {
  io: {
    host: string;
    port: string;
  };
  api: {
    url: string;
  };
}

const config: Config = {
  io: {
    host: import.meta.env.VITE_IO_HOST || 'localhost',
    port: import.meta.env.VITE_IO_PORT || '3000',
  },
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  },
};

export const get = (path: string): string => {
  const keys = path.split('.');
  let value: any = config;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      throw new Error(`Config path "${path}" not found`);
    }
  }

  return value;
};

export default {
  get,
};
