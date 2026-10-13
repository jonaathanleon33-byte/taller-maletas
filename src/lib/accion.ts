// Resultado común de las acciones del servidor que se llaman desde un
// botón (sin formulario): null = salió bien, { error } = mostrar el
// mensaje en pantalla en vez de fallar en silencio.
export type AccionResultado = { error: string } | null;
