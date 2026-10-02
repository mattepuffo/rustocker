import {createSignal, onMount, For, Show} from "solid-js";
import {invoke} from "@tauri-apps/api/core";

export default function DockerPsa() {
    const [containers, setContainers] = createSignal<Container[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    const loadContainers = async () => {
        setLoading(true);
        setError(null);

        try {
            const raw = await invoke<string>("docker_psa");

            // Ogni riga è un oggetto JSON
            const lines = raw.trim().split("\n").filter(Boolean);
            const parsed = lines.map((line) => JSON.parse(line) as Container);

            setContainers(parsed);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    onMount(() => {
        loadContainers();
    });

    return (
        <div class="container is-fluid mt-5">
            <div class="level">
                <div class="level-left">
                    <h1 class="title is-4">Docker Containers</h1>
                </div>

                <div class="level-right">
                    <button class="button is-primary"
                            classList={{"is-loading": loading()}}
                            onClick={loadContainers}
                            disabled={loading()}>
                        Refresh
                    </button>
                </div>
            </div>

            <Show when={error()}>
                <div class="notification is-danger is-light">
                    {error()}
                </div>
            </Show>

            <div class="table-container">
                <table class="table is-bordered is-fullwidth is-striped is-hoverable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Names</th>
                            <th>Image</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={containers()}>
                            {(c) => (
                                <tr>
                                    <td>
                                        <code>{c.ID.slice(0, 12)}</code>
                                    </td>

                                    <td>
                                        <strong>{c.Names}</strong>
                                    </td>

                                    <td>{c.Image}</td>

                                    <td>
                                        <span
                                            class="tag"
                                            classList={{
                                                "is-success": c.Status.startsWith("Up"),
                                                "is-danger": c.Status.startsWith("Exited"),
                                                "is-warning": !c.Status.startsWith("Up") && !c.Status.startsWith("Exited"),
                                            }}
                                        >
                                          {c.Status}
                                        </span>
                                    </td>

                                    <td></td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                </table>
            </div>

            <Show when={!loading() && containers().length === 0 && !error()}>
                <p class="has-text-grey has-text-centered mt-5">
                    Nessun container trovato
                </p>
            </Show>
        </div>
    );
}