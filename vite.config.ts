import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo (ex: .env, .env.local)
  // O terceiro parâmetro '' garante que carregue todas as variáveis, não apenas as com prefixo VITE_
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Isso substitui 'process.env.API_KEY' pelo valor da string da chave durante o build
      // Permitindo que o código client-side acesse a chave sem erro de "process is not defined"
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY),
    },
  }
})