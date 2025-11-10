import { ActorReady } from "./actor-ready.ts";
import { Init } from "./init.ts";
import { RenderActorSheet } from "./render-actor-sheet.ts";
import { Rest } from "./rest.ts";
import { Setup } from "./setup.ts";

interface Listener {
    listen(): void;
}

const HooksModule: Listener = {
    listen(): void {
        const listeners: Listener[] = [Init, Setup, ActorReady, RenderActorSheet, Rest];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksModule };
export type { Listener };
