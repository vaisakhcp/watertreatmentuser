import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { TextField, List, ListItem, ListItemText, IconButton, Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SignaturePad from 'react-signature-canvas';

const NotesComponent = ({ noteSignature, handleOpenSignatureModal, handleSign, updateData }) => {
  const [noteList, setNoteList] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteName, setNoteName] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      const notesSnapshot = await getDocs(collection(db, 'notes2'));
      const notesData = notesSnapshot.docs.map(doc => doc.data().notes);
      setNoteList(notesData.flat());
    };

    fetchNotes();
  }, []);

  const handleAddNote = () => {
    if (noteInput.trim()) {
      setNoteList([...noteList, noteInput.trim()]);
      setNoteInput('');
    }
  };

  const handleDeleteNote = (index) => {
    const newList = noteList.filter((_, i) => i !== index);
    setNoteList(newList);
  };

  const handleSaveNotes = async () => {
    const notesDoc = doc(db, 'notes2', 'noteList');
    await setDoc(notesDoc, { notes: noteList });
  };

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Notes</Typography>
        <List>
          {noteList.map((note, index) => (
            <ListItem key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <ListItemText primary={note} />
              <IconButton edge="end" onClick={() => handleDeleteNote(index)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
          <ListItem>
            <TextField
              fullWidth
              variant="outlined"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add a note"
            />
            <IconButton color="primary" onClick={handleAddNote}>
              <AddIcon />
            </IconButton>
          </ListItem>
        </List>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 3 }}>
          <TextField
            label="Name"
            value={noteName}
            onChange={(e) => setNoteName(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid lightgrey',
              cursor: 'pointer',
              height: '50px',
            }}
            onClick={handleOpenSignatureModal}
          >
            {noteSignature ? (
              <img src={noteSignature} alt="Signature" style={{ width: '100px', height: '50px' }} />
            ) : (
              'Sign'
            )}
          </Box>
        </Box>
        <Button variant="contained" color="primary" onClick={handleSaveNotes} sx={{ mt: 2 }}>
          Save Notes
        </Button>
      </Box>
    </>
  );
};

export default NotesComponent;
