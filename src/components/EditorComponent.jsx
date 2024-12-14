import React, { useState, useEffect } from "react";
import {
  Editor,
  EditorState,
  Modifier,
  convertToRaw,
  convertFromRaw,
} from "draft-js";

const MyEditor = () => {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const placeholderStates = ["Type Here...", ""];
  const [placeholder, setPlaceHolder] = useState(placeholderStates[0]);

  useEffect(() => {
    // Load saved content from localStorage on component mount
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

    // Handle empty block reset
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

    // Detect format triggers
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

  const handleFocus = () => {
    setPlaceHolder(placeholderStates[1]);
  };

  const handleBlur = () => {
    setPlaceHolder(placeholderStates[0]);
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
      <h1 className="text-center text-4xl font-bold text-blue-600 mb-8">
        Assignment: Draft.js Editor
      </h1>
      <div className="space-y-4 border-2 border-gray-300 p-4 rounded-md min-h-[400px] focus:outline-none">
        <Editor
          editorState={editorState}
          onChange={handleChange}
          blockStyleFn={blockStyleFn}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 mt-3 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-300"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default MyEditor;
