import {createSignal, onMount, For, Show} from "solid-js";
import {invoke} from "@tauri-apps/api/core";
import {FaSolidInfo, FaSolidPlayCircle, FaSolidStop} from "solid-icons/fa";

export default function DockerPsa() {
    const [containers, setContainers] = createSignal<Container[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    const loadContainers = async () => {
        setLoading(true);
        setError(null);
        try {
            const raw = await invoke<string>("docker_psa");
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

    // const startContainer = async (pid: number) => {
    //     const ok = await invoke<boolean>("start_container", {pid});
    //     if (!ok) alert(`Impossibile terminare il processo ${pid}`);
    // };

    const stopContainer = async (id: string) => {
        await invoke<boolean>("stop_container", {id});
        // if (!ok) alert(`Impossibile terminare il processo ${id}`);
    };

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
                            <th style={{width: "120px"}}></th>
                        </tr>
                    </thead>
                    
                    <tbody>
                        <For each={containers()}>
                            {(c) => {
                                const isRunning = c.Status.startsWith("Up");

                                return (
                                    <tr>
                                        <td>
                                            <code>{c.ID.slice(0, 12)}</code>
                                        </td>

                                        <td>
                                            <strong>{c.Names}</strong>
                                        </td>

                                        <td>{c.Image}</td>

                                        <td>
                                            <span class="tag"
                                                  classList={{
                                                      "is-success": isRunning,
                                                      "is-danger": c.Status.startsWith("Exited"),
                                                      "is-warning": !isRunning && !c.Status.startsWith("Exited"),
                                                  }}>
                                                {c.Status}
                                            </span>
                                        </td>

                                        <td>
                                            <button class="button is-small is-info mr-3 js-modal-trigger"
                                                    data-target="modal_info"
                                                    title="Info">
                                                <FaSolidInfo/>
                                            </button>

                                            {isRunning ? (
                                                <button class="button is-small is-danger"
                                                        title="Stop"
                                                        onClick={() => stopContainer(c.ID)}>
                                                    <FaSolidStop/>
                                                </button>
                                            ) : (
                                                <button class="button is-small is-success"
                                                        title="Stop"
                                                        onClick={() => stopContainer(c.ID)}>
                                                    <FaSolidPlayCircle/>
                                                </button>
                                            )}

                                        </td>
                                    </tr>
                                );
                            }}
                        </For>
                    </tbody>
                </table>
            </div>

            <Show when={!loading() && containers().length === 0 && !error()}>
                <p class="has-text-grey has-text-centered mt-5">
                    Nessun container trovato
                </p>
            </Show>

            <div id="modal_info" class="modal">
                <div class="modal-background"></div>
                <div class="modal-card">
                    <header class="modal-card-head">
                        <p class="modal-card-title">Modal title</p>
                        <button class="delete" aria-label="close"></button>
                    </header>
                    <section class="modal-card-body">
                    </section>
                    <footer class="modal-card-foot">
                        <div class="buttons">
                            <button class="button is-success">Save changes</button>
                            <button class="button">Cancel</button>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}