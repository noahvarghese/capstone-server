const sleep = async (milliseconds: number): Promise<void> => {
    return await new Promise<void>((res) => {
        setTimeout(() => {
            res();
        }, milliseconds);
    });
};

export default sleep;
