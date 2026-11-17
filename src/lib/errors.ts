export type DetalleError = { campo: string; mensaje: string };

export class ErrorHttp extends Error {
  constructor(
    readonly status: number,
    mensaje: string,
    readonly detalles?: DetalleError[],
    readonly cabeceras?: Record<string, string>,
  ) {
    super(mensaje);
    this.name = "ErrorHttp";
  }
}

export const noAutenticado = (m = "Sesión requerida") => new ErrorHttp(401, m);
export const prohibido = (m = "No tiene permiso para esta acción") => new ErrorHttp(403, m);
export const noEncontrado = (m = "No encontrado") => new ErrorHttp(404, m);
export const conflicto = (m: string) => new ErrorHttp(409, m);
