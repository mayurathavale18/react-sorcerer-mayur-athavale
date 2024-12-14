import React, { useState, useEffect } from "react";
import {
  Editor,
  EditorState,
  Modifier,
  convertToRaw,
  convertFromRaw,
} from "draft-js";
import "draft-js/dist/Draft.css";

const MyEditor = () => {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const [message, setMessage] = useState("");

  // Load saved content on mount
  useEffect(() => {
    const savedData = localStorage.getItem("editorContent");
    if (savedData) {
      const contentState = convertFromRaw(JSON.parse(savedData));
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, []);

  const handleChange = (state) => {
    const contentState = state.getCurrentContent();
    const selection = state.getSelection();
    const blockKey = selection.getAnchorKey();
    const block = contentState.getBlockForKey(blockKey);
    const text = block.getText();

    // Reset block type for empty text
    if (!text && block.getType() !== "unstyled") {
      const resetContent = Modifier.setBlockType(
        contentState,
        selection,
        "unstyled"
      );
      setEditorState(
        EditorState.push(state, resetContent, "change-block-type")
      );
      return;
    }

    // Detect formatting triggers
    if (text.startsWith("# ") && selection.getAnchorOffset() === 2) {
      applyBlockStyle(state, blockKey, text, "header-one", 2);
    } else if (text.startsWith("* ") && selection.getAnchorOffset() === 2) {
      applyBlockStyle(state, blockKey, text, "BOLD", 2);
    } else if (text.startsWith("** ") && selection.getAnchorOffset() === 3) {
      applyBlockStyle(state, blockKey, text, "RED", 3);
    } else if (text.startsWith("*** ") && selection.getAnchorOffset() === 4) {
      applyBlockStyle(state, blockKey, text, "UNDERLINE", 4);
    } else {
      setEditorState(state);
    }
  };

  const applyBlockStyle = (
    state,
    blockKey,
    text,
    newBlockType,
    triggerLength
  ) => {
    const newText = text.slice(triggerLength); // Remove trigger characters
    const contentState = state.getCurrentContent();
    const block = contentState.getBlockForKey(blockKey);

    const currentBlockType = block.getType();
    const combinedBlockType = currentBlockType
      .split(" ")
      .filter((type) => type !== "unstyled")
      .concat(newBlockType)
      .join(" ");

    const updatedBlock = block.merge({
      text: newText,
      type: combinedBlockType,
    });
    const updatedContent = contentState.merge({
      blockMap: contentState.getBlockMap().set(blockKey, updatedBlock),
    });

    const updatedSelection = state.getSelection().merge({
      anchorKey: blockKey,
      anchorOffset: 0,
      focusKey: blockKey,
      focusOffset: newText.length,
    });

    const newEditorState = EditorState.push(
      state,
      updatedContent,
      "change-block-type"
    );

    const resetSelection = updatedSelection.merge({
      anchorOffset: newText.length,
      focusOffset: newText.length,
    });

    setEditorState(EditorState.forceSelection(newEditorState, resetSelection));
  };

  const handleSave = () => {
    const content = editorState.getCurrentContent();
    const rawData = convertToRaw(content);
    localStorage.setItem("editorContent", JSON.stringify(rawData));
    setMessage("Content saved successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const blockStyleFn = (block) => {
    const types = block.getType().split(" ");
    const styles = types.map((type) => styleConfig[type]).filter(Boolean);

    return styles.join(" ");
  };

  const styleConfig = {
    "header-one": "text-3xl font-extrabold mb-4",
    BOLD: "font-bold",
    RED: "text-red-500",
    UNDERLINE: "underline",
  };

  return (
    <div className="container mx-auto p-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-lg shadow-lg">
      <h1 className="text-center text-3xl font-mono text-indigo-600 mb-8">
        Demo Editor by
        <span className="font-bold"> Mayur Athavale</span>
      </h1>
      <div className="border border-gray-400 bg-white p-4 rounded-md min-h-[400px] shadow-inner focus:outline-none">
        <Editor
          editorState={editorState}
          onChange={handleChange}
          blockStyleFn={blockStyleFn}
          placeholder="Start typing..."
        />
      </div>
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSave}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-md"
        >
          Save
        </button>
      </div>
      {message && (
        <p className="text-center text-green-600 mt-4 font-medium">{message}</p>
      )}
    </div>
  );
};

export default MyEditor;
