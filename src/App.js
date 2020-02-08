import React, { useState, useEffect } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";

import { createNote, updateNote, deleteNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
} from "./graphql/subscriptions";

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
    const deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: noteData => {
        const deletedNoteId = noteData.value.data.onDeleteNote.id;
        const updatedNotes = notes.filter(item => item.id !== deletedNoteId);
        setNotes(updatedNotes);
      },
    });
    const updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote;
        const index = notes.findIndex(item => item.id === updatedNote.id);
        setNotes([
          ...notes.slice(0, index),
          updatedNote,
          ...notes.slice(index + 1),
        ]);
      },
    });

    return () => {
      createNoteListener.unsubscribe();
      deleteNoteListener.unsubscribe();
      updateNoteListener.unsubscribe();
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
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      await API.graphql(graphqlOperation(createNote, { input: { note } }));
      setNote("");
    }
  };

  const handleUpdateNote = async () => {
    await API.graphql(graphqlOperation(updateNote, { input: { id, note } }));
    setNote("");
    setId("");
  };

  const handleDeleteNote = async id => {
    return API.graphql(graphqlOperation(deleteNote, { input: { id } }));
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
