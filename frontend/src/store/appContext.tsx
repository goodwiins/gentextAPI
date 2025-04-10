import React, { useState, useEffect, createContext } from "react";
import getState from "./flux";

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

export const Context = createContext<State | null>(null);

const injectContext = (PassedComponent: React.FC) => {
    const StoreWrapper: React.FC = (props) => {
        const [state, setState] = useState<State>({
            store: {
                message: null,
                demo: []
            },
            actions: {
                exampleFunction: () => {},
                getMessage: async () => {},
                changeColor: () => {}
            }
        });

        useEffect(() => {
            setState(
                getState({
                    getStore: () => state.store,
                    getActions: () => state.actions,
                    setStore: (updatedStore) => setState(prevState => ({
                        store: { ...prevState.store, ...updatedStore },
                        actions: { ...prevState.actions }
                    }))
                })
            );
        }, [state.store, state.actions]);

        useEffect(() => {
            state.actions.getMessage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return (
            <Context.Provider value={state}>
                <PassedComponent {...props} />
            </Context.Provider>
        );
    };

    return StoreWrapper;
};

export default injectContext;
