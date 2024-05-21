import React, { useState, useEffect, createContext } from "react";
import { getState } from "./flux";

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
        const [state, setState] = useState<State | null>(null);

        useEffect(() => {
            if (!state) {
                setState(
                    getState({
                        getStore: () => state?.store,
                        getActions: () => state?.actions,
                        setStore: (updatedStore) =>
                            setState({
                                store: Object.assign(state.store, updatedStore),
                                actions: { ...state.actions }
                            })
                    })
                );
            }
        }, [state]);

        useEffect(() => {
            if (state) {
                state.actions.getMessage();
            }
        }, [state]);

        return state ? (
            <Context.Provider value={state}>
                <PassedComponent {...props} />
            </Context.Provider>
        ) : null;
    };

    return StoreWrapper;
};

export default injectContext;
