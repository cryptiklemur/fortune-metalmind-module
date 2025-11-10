import { FortuneManager } from "../fortune-manager.ts";
import { Logger } from "../logger.ts";

export class FortuneDialog {
    static async show(actor: Actor): Promise<void> {
        const fortuneData = FortuneManager.getFortuneData(actor as any);
        const tapOptions = FortuneManager.settings.tapOptions;

        const content = `
            <div class="fortune-dialog">
                <div class="fortune-header">
                    <h3>Fortune: ${fortuneData.current}/${fortuneData.max}</h3>
                    ${fortuneData.tapAvailable ? '<span class="tap-status available">Tap Available</span>' : '<span class="tap-status unavailable">Tap Used</span>'}
                </div>

                <div class="fortune-section">
                    <h4>Tap Fortune</h4>
                    ${tapOptions.map(option => `
                        <button class="fortune-tap-btn" data-cost="${option.cost}" data-effect="${option.effect}" data-macro="${option.customMacro || ''}" data-script="${option.customScript || ''}" ${!fortuneData.tapAvailable || fortuneData.current < option.cost ? 'disabled' : ''}>
                            <span class="option-label">${option.label}</span>
                            <span class="option-cost">${option.cost} Fortune</span>
                        </button>
                    `).join('')}
                </div>

                <div class="fortune-section">
                    <h4>Store Fortune</h4>
                    <button class="fortune-store-btn" ${fortuneData.conversionsRemaining <= 0 || fortuneData.current >= fortuneData.max ? 'disabled' : ''}>
                        <span>Convert Opportunity to Fortune</span>
                        <span class="conversions-remaining">${fortuneData.conversionsRemaining}/${fortuneData.conversionsMax} remaining</span>
                    </button>
                </div>

                <div class="fortune-section">
                    <h4>Re-Connecting</h4>
                    <button class="fortune-reconnect-btn" ${!fortuneData.refocusAvailable ? 'disabled' : ''}>
                        <span>Re-Connect with Fortune Metalmind</span>
                        <span class="reconnect-status">${fortuneData.refocusAvailable ? 'Available' : 'Used'}</span>
                    </button>
                </div>
            </div>
        `;

        new (globalThis as any).Dialog({
            title: "Fortune Metalmind",
            content,
            buttons: {
                close: {
                    label: "Close",
                    icon: '<i class="fas fa-times"></i>'
                }
            },
            render: (html: JQuery) => {
                html.find(".fortune-tap-btn").on("click", async function() {
                    const $btn = $(this);
                    const cost = parseInt($btn.data("cost"), 10);
                    const effect = $btn.data("effect");
                    const label = $btn.find('.option-label').text();

                    const success = await FortuneManager.tapFortune(actor as any, cost);
                    if (success) {
                        await ChatMessage.create({
                            content: `<p><strong>${(actor as any).name}</strong> tapped their Fortune Metalmind: <em>${label}</em></p>`,
                            speaker: ChatMessage.getSpeaker({ actor: actor as any }),
                        });

                        html.closest(".app").find(".dialog-button.close").trigger("click");
                    }
                });

                html.find(".fortune-store-btn").on("click", async function() {
                    const success = await FortuneManager.convertOpportunity(actor as any);
                    if (success) {
                        await ChatMessage.create({
                            content: `<p><strong>${(actor as any).name}</strong> stored an Opportunity as Fortune in their chromium medallion.</p>`,
                            speaker: ChatMessage.getSpeaker({ actor: actor as any }),
                        });

                        html.closest(".app").find(".dialog-button.close").trigger("click");
                    }
                });

                html.find(".fortune-reconnect-btn").on("click", async function() {
                    await ChatMessage.create({
                        content: `<p><strong>${(actor as any).name}</strong> attempts to re-connect with their Fortune Metalmind...</p>`,
                        speaker: ChatMessage.getSpeaker({ actor: actor as any }),
                    });

                    await FortuneManager.performRefocus(actor as any);
                    html.closest(".app").find(".dialog-button.close").trigger("click");
                });
            },
            default: "close"
        }).render(true);
    }
}