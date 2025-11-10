class HandlebarHelpers {
    register(): void {
        Handlebars.registerHelper("eq", (a: unknown, b: unknown) => {
            return a === b;
        });

        Handlebars.registerHelper("add", (a: number, b: number) => {
            return a + b;
        });

        Handlebars.registerHelper("or", (...args: unknown[]) => {
            return args.slice(0, -1).some(Boolean);
        });

        Handlebars.registerHelper("lte", (a: number, b: number) => {
            return a <= b;
        });

        Handlebars.registerHelper("not", (value: unknown) => {
            return !value;
        });
    }
}

export { HandlebarHelpers };
