# Índice de Firestore para Registro de ventas

La consulta base usa un rango sobre `fechaVenta`, orden descendente por `fechaVenta` y desempate por ID de documento. Los filtros exactos agregan `folio ==` y/o `vendedor ==`.

El índice declarado en `firestore.indexes.json` cubre:

- `folio` + `fechaVenta` + `__name__`.

El vendedor se filtra exactamente sobre el conjunto analítico completo ya cargado para el periodo y folio aplicados. La tabla, las tarjetas, las gráficas y Excel reutilizan ese mismo conjunto; por ello no se necesita un índice adicional por vendedor.

No se incluyen reglas en este repositorio. En el repositorio que administra las reglas, `ventas_gaslink/{document}` debe permitir únicamente `read` a los mismos usuarios autorizados para `Panel de expendio`, y negar escrituras del cliente.
