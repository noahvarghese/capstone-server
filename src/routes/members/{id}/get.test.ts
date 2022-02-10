describe.skip("permissions", () => {
    const cases = [
        { access: "ADMIN", success: true },
        { access: "MANAGER", success: true },
        { access: "USER", success: false },
    ];
    test.each(cases)("%p", async () => {
        return;
    });
});
