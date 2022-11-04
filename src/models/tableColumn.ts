export type TableColumn = {
    name: string,
    label: string,
    field: string,
    align?: string,
    format?: (value: string) => string,
    style?: string,
    headerStyle?: string,
    classes?: string,
}