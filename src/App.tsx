import DockerPsa from "./components/DockerPsa.tsx";
import {createEffect, createSignal, onCleanup, onMount} from "solid-js";
import {Submenu} from "@tauri-apps/api/menu/submenu";
import {Menu} from "@tauri-apps/api/menu/menu";
import {MenuItem} from "@tauri-apps/api/menu/menuItem";
import {invoke} from "@tauri-apps/api/core";
import ModalDockerSystemDf from "./components/ModalDockerSystemDf.tsx";

import "bulma/css/bulma.min.css";
import "./App.css";
import {DockerDfItem} from "./components/DockerDfItem.ts";

function App() {
    const [isOpen, setIsOpen] = createSignal(false);
    const [data, setData] = createSignal<DockerDfItem[]>([]);
    const [inspectLoading, setInspectLoading] = createSignal(false);
    const [inspectError, setInspectError] = createSignal<string | null>(null);

    createEffect(() => {
        if (!isOpen()) return;

        setData([]);
        setInspectError(null);
        setInspectLoading(true);

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        window.addEventListener("keydown", handleKey);
        onCleanup(() => window.removeEventListener("keydown", handleKey));

        invoke<string>("docker_system_df")
            .then((result) => {
                const parsed: DockerDfItem[] = JSON.parse(result);
                setData(parsed);
            })
            .catch((err) => {
                setInspectError(String(err));
            })
            .finally(() => {
                setInspectLoading(false);
            });
    });

    onMount(async () => {
        const openItem = await MenuItem.new({
            text: 'Docker System Df',
            action: () => {
                setIsOpen(true);
            },
        });

        const quitItem = await MenuItem.new({
            text: 'Quit',
            action: async () => {
                const {exit} = await import('@tauri-apps/plugin-process');
                await exit(0);
            },
        });

        const fileSubmenu = await Submenu.new({
            text: 'File',
            items: [openItem, quitItem],
        });

        const menu = await Menu.new({
            items: [fileSubmenu],
        });

        await menu.setAsAppMenu();
    });

    return (
        <main>
            <DockerPsa/>

            <ModalDockerSystemDf isOpen={isOpen()}
                                 onClose={() => setIsOpen(false)}
                                 title="Docker System DF"
                                 size="is-fullwidth"
                                 loading={inspectLoading()}
                                 error={inspectError()}
                                 data={data()}
            />
        </main>
    );
}

export default App;
