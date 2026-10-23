import {createSignal, onMount, onCleanup, Show, For} from "solid-js";
import {invoke} from "@tauri-apps/api/core";
import {ModalPropsStats} from "../models/ModalProps.ts";

export default function ModalStats(props: ModalPropsStats) {
    const [stats, setStats] = createSignal<any[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    let interval: number | undefined;

    onMount(() => {
        const getStats = async () => {
            try {
                // loading grosso solo la prima volta
                if (stats().length === 0) setLoading(true);

                const result = await invoke<string>("docker_stats");
                const parsed = JSON.parse(result);
                setStats(parsed);
                setError(null);
            } catch (err) {
                setError(String(err));
            } finally {
                setLoading(false);
            }
        };

        getStats();
        interval = window.setInterval(getStats, 2000);
    });

    onCleanup(() => {
        if (interval) clearInterval(interval);
    });

    return (
        <div
            class={`modal ${props.isOpen ? "is-active" : ""}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div class="modal-background" onClick={props.onClose}></div>

            <div class={`modal-card ${props.size ?? ""}`}>
                <header class="modal-card-head">
                    <p class="modal-card-title">{props.title ?? "Stats"}</p>
                    <button
                        class="delete"
                        aria-label="close"
                        onClick={props.onClose}
                    />
                </header>

                <section class="modal-card-body">
                    {/* Spinner solo al primo caricamento */}
                    <Show when={loading() && stats().length === 0}>
                        <div class="has-text-centered py-6">
                            <button class="button is-loading is-ghost is-large"/>
                            <p class="mt-3 has-text-grey">Caricamento stats...</p>
                        </div>
                    </Show>

                    {/* Errore */}
                    <Show when={error()}>
                        <div class="notification is-danger is-light">
                            {error()}
                        </div>
                    </Show>

                    {/* Tabella stats */}
                    <Show when={stats().length > 0}>
                        <div class="table-container">
                            <table class="table is-fullwidth is-striped is-hoverable is-size-7">
                                <thead>
                                    <tr>
                                        <th>Container</th>
                                        <th>CPU %</th>
                                        <th>Memoria</th>
                                        <th>Mem %</th>
                                        <th>Net I/O</th>
                                        <th>Block I/O</th>
                                        <th>PIDs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <For each={stats()}>
                                        {(item) => (
                                            <tr>
                                                <td class="has-text-weight-semibold">
                                                    {item.Name || item.Container || "—"}
                                                </td>
                                                <td>{item.CPUPerc || "—"}</td>
                                                <td>{item.MemUsage || "—"}</td>
                                                <td>{item.MemPerc || "—"}</td>
                                                <td>{item.NetIO || "—"}</td>
                                                <td>{item.BlockIO || "—"}</td>
                                                <td>{item.PIDs || "—"}</td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                </section>

                <footer class="modal-card-foot is-justify-content-flex-end">
                    <button class="button" onClick={props.onClose}>
                        Chiudi
                    </button>
                </footer>
            </div>
        </div>
    );
}