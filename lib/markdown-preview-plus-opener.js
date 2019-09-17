"use babel";

import { CompositeDisposable } from "atom";

export const config = {
  suffixes: {
    type: "array",
    default: ["markdown", "md", "mdown", "mkd", "mkdow"],
    items: {
      type: "string"
    }
  },
  closePreviewWhenClosingEditor: {
    type: "boolean",
    default: false
  },
  previewSplitDirection: {
    type: "string",
    default: "right",
    enum: ["left", "right", "up", "down"]
  }
};

let disposables;

export function activate() {
  setImmediate(() => {
    if (!atom.packages.getLoadedPackage("markdown-preview-plus")) {
      atom.notifications.addWarning(
        "markdown-preview-plus-opener: markdown-preview-plus package not found",
        {
          dismissable: true
        }
      );
    }
  });

  disposables = new CompositeDisposable();
  disposables.add(
    atom.workspace.onDidAddTextEditor(function(event) {
      subscribeEditor(event.textEditor).catch(function(e) {
        atom.notifications.addFatalError("markdown-preview-plus-opener error", {
          detail: e.message,
          stack: e.stack,
          dismissable: true
        });
      });
    })
  );
}

export function deactivate() {
  disposables && disposables.dispose();
  disposables = undefined;
}

async function subscribeEditor(editor) {
  const path = editor.getPath();
  if (path == null) return;
  const suffix = path.match(/(\w*)$/)[1];
  if (
    atom.config.get("markdown-preview-plus-opener.suffixes").includes(suffix)
  ) {
    const previewUrl = `markdown-preview-plus://editor/${editor.id}`;
    preview = await atom.workspace.open(previewUrl, {
      searchAllPanes: true,
      split: atom.config.get(
        "markdown-preview-plus-opener.previewSplitDirection"
      )
    });
    if (
      preview &&
      disposables &&
      atom.config.get(
        "markdown-preview-plus-opener.closePreviewWhenClosingEditor"
      )
    ) {
      const disp = editor.onDidDestroy(() => {
        atom.workspace.paneForItem(preview).destroyItem(preview);
        disp.dispose();
        disposables.remove(disp);
      });
      disposables.add(disp);
    }
  }
}
