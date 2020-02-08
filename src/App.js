import React, { useState, useEffect } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";

import { createNote, updateNote, deleteNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import { onCreateNote } from "./graphql/subscriptions";

function App() {
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const getListNotes = async () => {
      const result = await API.graphql(graphqlOperation(listNotes));
      setNotes(result.data.listNotes.items);
    };
    const createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        setNotes([newNote, ...notes]);
      },
    });
    getListNotes();

    return () => {
      createNoteListener.unsubscribe();
    };
  }, [notes]);

  const handleChangeNote = event => {
    setNote(event.target.value);
  };

  const hasExistingNote = () => {
    if (id) {
      return notes.findIndex(item => item.id === id) > -1 ? true : false;
    }
    return false;
  };

  const handleAddNote = async event => {
    event.preventDefault();
    await API.graphql(graphqlOperation(createNote, { input: { note } }));
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      setNote("");
    }
  };

  const handleUpdateNote = async () => {
    const result = await API.graphql(
      graphqlOperation(updateNote, { input: { id, note } })
    );
    const updatedNote = result.data.updateNote;
    const index = notes.findIndex(item => item.id === updatedNote.id);
    setNotes([
      ...notes.slice(0, index),
      updatedNote,
      ...notes.slice(index + 1),
    ]);
    setNote("");
    setId("");
  };

  const handleDeleteNote = async id => {
    const result = await API.graphql(
      graphqlOperation(deleteNote, { input: { id } })
    );
    const deletedNoteId = result.data.deleteNote.id;
    const updatedNotes = notes.filter(item => item.id !== deletedNoteId);
    setNotes(updatedNotes);
  };

  const handleSetNote = ({ id, note }) => {
    setNote(note);
    setId(id);
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Notetaker</h1>
      <form onSubmit={handleAddNote} className="mb3">
        <input
          type="text"
          className="pa2 f4"
          placeholder="Write your note"
          onChange={handleChangeNote}
          value={note}
        />
        <button className="pa2 f4" type="submit">
          {id ? "Update note" : "Add note"}
        </button>
      </form>
      <div>
        {notes.map(item => (
          <div key={item.id} className="flex items-center">
            <li onClick={() => handleSetNote(item)} className="list pa1 f3">
              {item.note}
            </li>
            <button
              onClick={() => handleDeleteNote(item.id)}
              style={{ cursor: "pointer" }}
              className="bg-transparent bn f4"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
