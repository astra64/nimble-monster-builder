import { MonsterBuilder } from "./apps/MonsterBuilder.js";
import { createMonster } from "./builder.js";
import { MODULE_ID } from "./constants.js";
import { resolve } from "./lib/index.js";

Hooks.once("init", () => {
  const module = game.modules.get(MODULE_ID);
  if (module) module.api = { open: () => MonsterBuilder.open(), resolve, createMonster };
});

/** Add a "Monster Builder" button to the Actors sidebar header. */
Hooks.on("renderActorDirectory", (app, html) => {
  if (game.system.id !== "nimble" || !game.user.can("ACTOR_CREATE")) return;
  const root = html instanceof HTMLElement ? html : html[0];
  if (root.querySelector(".nmb-open")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "nmb-open";
  button.innerHTML = `<i class="fa-solid fa-dragon"></i> ${game.i18n.localize("NMB.Builder.OpenButton")}`;
  button.addEventListener("click", () => MonsterBuilder.open());

  const header = root.querySelector(".header-actions") ?? root.querySelector(".directory-header");
  header?.append(button);
});
