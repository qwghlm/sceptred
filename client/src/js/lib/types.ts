// Represents the grid data object we get back from the API
export interface GridData {
    meta: {
        squareSize: number,
        gridReference: string
    },
    heights: any[][],
}
