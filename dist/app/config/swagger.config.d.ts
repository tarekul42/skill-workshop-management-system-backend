export declare const swaggerOptions: {
    definition: {
        openapi: string;
        info: {
            title: string;
            version: string;
            description: string;
        };
        servers: {
            url: string;
            description: string;
        }[];
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: string;
                    scheme: string;
                    bearerFormat: string;
                };
            };
            schemas: {
                BaseResponse: {
                    type: string;
                    properties: {
                        success: {
                            type: string;
                            example: boolean;
                        };
                        message: {
                            type: string;
                        };
                        data: {
                            type: string;
                        };
                    };
                };
                ErrorResponse: {
                    type: string;
                    properties: {
                        success: {
                            type: string;
                            example: boolean;
                        };
                        message: {
                            type: string;
                        };
                        errorSources: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    path: {
                                        type: string;
                                    };
                                    message: {
                                        type: string;
                                    };
                                };
                            };
                        };
                        stack: {
                            type: string;
                        };
                    };
                };
                User: {
                    type: string;
                    properties: {
                        _id: {
                            type: string;
                        };
                        name: {
                            type: string;
                        };
                        email: {
                            type: string;
                        };
                        phone: {
                            type: string;
                        };
                        picture: {
                            type: string;
                        };
                        age: {
                            type: string;
                        };
                        address: {
                            type: string;
                        };
                        role: {
                            type: string;
                            enum: string[];
                        };
                        isActive: {
                            type: string;
                            enum: string[];
                        };
                        isVerified: {
                            type: string;
                        };
                        createdAt: {
                            type: string;
                            format: string;
                        };
                    };
                };
                Category: {
                    type: string;
                    properties: {
                        _id: {
                            type: string;
                        };
                        name: {
                            type: string;
                        };
                        slug: {
                            type: string;
                        };
                        thumbnail: {
                            type: string;
                        };
                        description: {
                            type: string;
                        };
                    };
                };
                Level: {
                    type: string;
                    properties: {
                        _id: {
                            type: string;
                        };
                        name: {
                            type: string;
                        };
                    };
                };
                Workshop: {
                    type: string;
                    properties: {
                        _id: {
                            type: string;
                        };
                        title: {
                            type: string;
                        };
                        slug: {
                            type: string;
                        };
                        description: {
                            type: string;
                        };
                        images: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        location: {
                            type: string;
                        };
                        price: {
                            type: string;
                        };
                        startDate: {
                            type: string;
                            format: string;
                        };
                        endDate: {
                            type: string;
                            format: string;
                        };
                        whatYouLearn: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        prerequisites: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        benefits: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        syllabus: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        maxSeats: {
                            type: string;
                        };
                        minAge: {
                            type: string;
                        };
                        category: {
                            $ref: string;
                        };
                        level: {
                            $ref: string;
                        };
                    };
                };
                Enrollment: {
                    type: string;
                    properties: {
                        _id: {
                            type: string;
                        };
                        user: {
                            $ref: string;
                        };
                        workshop: {
                            $ref: string;
                        };
                        studentCount: {
                            type: string;
                        };
                        status: {
                            type: string;
                            enum: string[];
                        };
                        createdAt: {
                            type: string;
                            format: string;
                        };
                    };
                };
                Payment: {
                    type: string;
                    properties: {
                        _id: {
                            type: string;
                        };
                        enrollment: {
                            type: string;
                        };
                        transactionId: {
                            type: string;
                        };
                        amount: {
                            type: string;
                        };
                        invoiceUrl: {
                            type: string;
                        };
                        status: {
                            type: string;
                            enum: string[];
                        };
                    };
                };
            };
            responses: {
                BadRequestError: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                UnauthorizedError: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                ForbiddenError: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                NotFoundError: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                InternalServerError: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                TooManyRequestsError: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                ConflictError: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
            };
        };
    };
    apis: string[];
};
export declare const swaggerSpec: {
    openapi: string;
    info: object;
    servers: object[];
    components: object;
    paths: object;
    tags: object[];
};
