import { ActorReady } from "./actor-ready.ts";
import { GreyRows } from "./grey-rows.ts";
import { Init } from "./init.ts";
import { Rest } from "./rest.ts";
import { Setup } from "./setup.ts";
import { UseItem } from "./use-item.ts";

interface Listener {
    listen(): void;
}

const HooksModule: Listener = {
    listen(): void {
        const listeners: Listener[] = [
            Init,
            Setup,
            ActorReady,
            Rest,
            UseItem,
            GreyRows,
        ];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksModule };
export type { Listener };
