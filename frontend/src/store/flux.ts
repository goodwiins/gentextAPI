import { Dispatch, SetStateAction } from "react";

interface Store {
    message: string | null;
    demo: { title: string; background: string; initial: string }[];
}

interface Actions {
    exampleFunction: () => void;
    getMessage: () => Promise<any>;
    changeColor: (index: number, color: string) => void;
}

interface State {
    store: Store;
    actions: Actions;
}

const getState = ({ getStore, getActions, setStore }: { getStore: () => Store; getActions: () => Actions; setStore: Dispatch<SetStateAction<Store>> }): State => {
    return {
        store: {
            message: null,
            demo: [
                {
                    title: "FIRST",
                    background: "white",
                    initial: "white"
                },
                {
                    title: "SECOND",
                    background: "white",
                    initial: "white"
                }
            ]
        },
        actions: {
            exampleFunction: () => {
                getActions().changeColor(0, "green");
            },
            getMessage: async () => {
                try {
                    const resp = await fetch(process.env.BACKEND_URL + "/api/hello");
                    const data = await resp.json();
                    const store = getStore();
                    setStore({ ...store, message: data.message });
                    return data;
                } catch (error) {
                    console.log("Error loading message from backend", error);
                }
            },
            changeColor: (index, color) => {
                const store = getStore();
                const demo = store.demo.map((elm, i) => {
                    if (i === index) elm.background = color;
                    return elm;
                });
                setStore({ ...store, demo: demo });
            }
        }
    };
};

export default getState;
