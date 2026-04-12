interface ICategory {
    name: string;
    slug: string;
    thumbnail?: string;
    description?: string;
    isDeleted?: boolean;
    deletedAt?: Date;
}
export { ICategory };
