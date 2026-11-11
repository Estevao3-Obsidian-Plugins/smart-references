const { Plugin, Modal, Setting, Notice } = require("obsidian");

const ACTIVE_CLASS = "smart-reference-active";
const DEFAULT_COLOR = "#c49aff";
const PALETTE = [
  { name: "Vermelho", hex: "#e53935" },
  { name: "Laranja", hex: "#fb8c00" },
  { name: "Amarelo", hex: "#fdd835" },
  { name: "Verde", hex: "#43a047" },
  { name: "Azul", hex: "#1e88e5" },
  { name: "Anil", hex: "#3949ab" },
  { name: "Violeta", hex: "#8e24aa" },
  { name: "Rosa", hex: "#ec407a" },
  { name: "Turquesa", hex: "#00acc1" },
  { name: "Marrom", hex: "#8d6e63" },
  { name: "Cinza", hex: "#78909c" },
  { name: "Branco", hex: "#ffffff" }
];

class ReferenceIdModal extends Modal {
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
    this.value = "";
    this.color = "#8e24aa";
    this.underline = true;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Smart References" });
    contentEl.createEl("p", {
      text: "Configure a aparência desta referência e escolha seu identificador."
    });

    new Setting(contentEl)
      .setName("Identificador da referência")
      .setDesc("Use letras, números, hífens ou sublinhados. Ex.: introducao-alusao")
      .addText((text) => {
        text.setPlaceholder("minha-referencia")
          .onChange((value) => { this.value = value.trim(); });
        text.inputEl.focus();
        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            this.submit();
          }
        });
      });

    const paletteSetting = new Setting(contentEl)
      .setName("Cor do destaque")
      .setDesc("Selecione uma cor. Passe o mouse sobre a bolinha para ver o nome.");

    const swatches = paletteSetting.controlEl.createDiv({ cls: "smart-reference-palette" });
    const buttons = [];

    for (const color of PALETTE) {
      const button = swatches.createEl("button", {
        cls: "smart-reference-swatch",
        attr: { type: "button", "aria-label": color.name, title: color.name, "aria-pressed": "false" }
      });

      // Define a cor diretamente no elemento para evitar sobrescrita pelo tema do Obsidian.
      button.style.setProperty("background-color", color.hex, "important");
      button.style.setProperty("background-image", "none", "important");
      button.style.setProperty("border-color", color.hex === "#ffffff" ? "#a0a0a0" : "var(--background-modifier-border)");

      button.addEventListener("click", () => {
        this.color = color.hex;
        for (const candidate of buttons) {
          candidate.classList.remove("is-selected");
          candidate.setAttribute("aria-pressed", "false");
        }
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      });

      buttons.push(button);
    }

    const initialIndex = PALETTE.findIndex(color => color.hex === this.color);
    if (initialIndex >= 0) {
      buttons[initialIndex].classList.add("is-selected");
      buttons[initialIndex].setAttribute("aria-pressed", "true");
    }

    new Setting(contentEl)
      .setName("Manter sublinhado")
      .setDesc("Ative para sublinhar o trecho enquanto a referência estiver sob o mouse.")
      .addToggle((toggle) => {
        toggle.setValue(true);
        toggle.onChange((value) => { this.underline = value; });
      });

    new Setting(contentEl)
      .addButton((button) => button.setButtonText("Cancelar").onClick(() => this.close()))
      .addButton((button) => button.setButtonText("Aplicar referência").setCta().onClick(() => this.submit()));

    this.addPaletteStyles();
  }

  addPaletteStyles() {
    if (document.getElementById("smart-reference-palette-styles")) return;
    const style = document.createElement("style");
    style.id = "smart-reference-palette-styles";
    style.textContent = `
      .smart-reference-palette {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        align-items: center;
        justify-content: flex-start;
        max-width: 280px;
      }
      .smart-reference-swatch {
        appearance: none !important;
        -webkit-appearance: none !important;
        width: 25px !important;
        height: 25px !important;
        min-width: 25px !important;
        min-height: 25px !important;
        padding: 0 !important;
        border-radius: 50% !important;
        border: 2px solid var(--background-modifier-border) !important;
        cursor: pointer !important;
        position: relative;
        box-shadow: 0 0 0 1px var(--background-primary);
      }
      .smart-reference-swatch:hover {
        transform: scale(1.12);
        border-color: var(--text-normal) !important;
      }
      .smart-reference-swatch.is-selected {
        outline: 2px solid var(--interactive-accent) !important;
        outline-offset: 3px;
      }
      .smart-reference-swatch[aria-label="Branco"] {
        border-color: #a0a0a0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  submit() {
    const id = this.value.trim();
    if (!id) return new Notice("Digite um identificador.");
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return new Notice("Use apenas letras, números, hífen e sublinhado.");
    this.onSubmit({ id, color: this.color, underline: this.underline });
    this.close();
  }

  onClose() { this.contentEl.empty(); }
}

module.exports = class SmartReferencesPlugin extends Plugin {
  onload() {
    this.addStyles();

    this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor) => {
      const selection = editor.getSelection();
      if (!selection || !selection.trim()) return;
      menu.addItem(item => item.setTitle("Smart References").setIcon("highlighter").onClick(() => {
        new ReferenceIdModal(this.app, ({ id, color, underline }) => {
          const currentSelection = editor.getSelection();
          if (!currentSelection || !currentSelection.trim()) return new Notice("Selecione um trecho antes de aplicar Smart References.");
          const underlineValue = underline ? "true" : "false";
          editor.replaceSelection(`<span class="${id}" data-smart-reference-color="${color}" data-smart-reference-underline="${underlineValue}">${currentSelection}</span>`);
          new Notice(`Smart Reference "${id}" criada.`);
        }).open();
      }));
    }));

    this.registerDomEvent(document, "pointerover", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a.internal-link");
      if (!link) return;
      if (event.relatedTarget instanceof Node && link.contains(event.relatedTarget)) return;
      const view = link.closest(".markdown-preview-view");
      if (!view) return;
      const id = this.getBlockId(link.getAttribute("data-href"));
      if (!id) return;
      this.clearHighlights();
      [...view.querySelectorAll("[class]")].filter(el => el.classList.contains(id)).forEach(el => {
        el.classList.add(ACTIVE_CLASS);
        const color = el.getAttribute("data-smart-reference-color") || DEFAULT_COLOR;
        const underline = el.getAttribute("data-smart-reference-underline");
        el.style.setProperty("--smart-reference-color", color);
        el.style.setProperty("--smart-reference-underline", underline === "false" ? "none" : "underline");
      });
    }, true);

    this.registerDomEvent(document, "pointerout", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a.internal-link");
      if (!link) return;
      if (event.relatedTarget instanceof Node && link.contains(event.relatedTarget)) return;
      this.clearHighlights();
    }, true);
  }

  onunload() {
    this.clearHighlights();
    document.getElementById("smart-references-styles")?.remove();
    document.getElementById("smart-reference-palette-styles")?.remove();
  }

  getBlockId(destination) {
    if (!destination) return null;
    const marker = destination.lastIndexOf("#^");
    if (marker === -1) return null;
    let id = destination.slice(marker + 2);
    try { id = decodeURIComponent(id); } catch (_) {}
    return id || null;
  }

  clearHighlights() {
    document.querySelectorAll(`.${ACTIVE_CLASS}`).forEach(el => {
      el.classList.remove(ACTIVE_CLASS);
      el.style.removeProperty("--smart-reference-color");
      el.style.removeProperty("--smart-reference-underline");
    });
  }

  addStyles() {
    if (document.getElementById("smart-references-styles")) return;
    const style = document.createElement("style");
    style.id = "smart-references-styles";
    style.textContent = `
      .markdown-preview-view .${ACTIVE_CLASS} {
        color: var(--smart-reference-color, ${DEFAULT_COLOR}) !important;
        text-decoration: var(--smart-reference-underline, underline) !important;
        text-decoration-thickness: 2px;
        text-underline-offset: 4px;
        transition: color 0.15s ease;
      }
    `;
    document.head.appendChild(style);
  }
};
