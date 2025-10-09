export type UserRole = "admin" | "servidor_lider" | "servidor_colider"
export type TipoServidor = "lider" | "colider"

export interface Caminante {
  id: string
  nombre_completo: string
  cedula: string
  fecha_nacimiento: string
  edad: number
  celular: string
  correo: string
  direccion: string
  ciudad: string
  estado_civil: string
  profesion: string
  empresa?: string
  cargo?: string
  nombre_contacto_emergencia: string
  parentesco_contacto: string
  celular_contacto: string
  nombre_contacto_emergencia_2?: string
  parentesco_contacto_2?: string
  celular_contacto_2?: string
  es_sorpresa: boolean
  ronca_al_dormir: boolean
  condicion_especial?: string
  talla_camisa: string
  sacramentos_recibidos: string[]
  quien_invito?: string
  invitador_hizo_retiro?: boolean
  eps: string
  tipo_sangre: string
  medicamentos?: string
  restricciones_alimenticias?: string
  parroquia: string
  parroco: string
  monto_pagado: number
  monto_total: number
  cartas_recibidas: number
  fotos_recibidas: number
  mesa_id?: string
  created_at: string
  updated_at: string
}

export interface Servidor {
  id: string
  auth_user_id?: string
  nombre_completo: string
  cedula: string
  fecha_nacimiento: string
  edad: number
  celular: string
  correo: string
  direccion: string
  ciudad: string
  estado_civil: string
  profesion: string
  nombre_contacto_emergencia: string
  parentesco_contacto: string
  celular_contacto: string
  eps: string
  tipo_sangre: string
  parroquia: string
  retiros_anteriores: number
  experiencia_servicio?: string
  tipo_servidor?: TipoServidor
  monto_pagado: number
  monto_total: number
  mesa_id?: string
  created_at: string
  updated_at: string
}

export interface Mesa {
  id: string
  numero: number
  nombre?: string
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  nombre_completo: string
  role: UserRole
  created_at: string
}
