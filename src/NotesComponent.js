import React, { useState, useEffect, useRef } from 'react';
import { collection, getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { TextField, List, ListItem, ListItemText, IconButton, Box, Typography, Button, Modal } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SignaturePad from 'react-signature-canvas';

const NotesComponent = ({ noteSignature, setNoteSignature, handleSaveNotes, noteName, setNoteName }) => {
  const [noteList, setNoteList] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const sigPadRef = useRef(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const docRef = doc(db, 'notes', 'noteList');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNoteList(data.notes || []);
          setNoteSignature(data.signature || '');
          setNoteName(data.name || '');
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, [setNoteSignature, setNoteName]);

  const handleAddNote = () => {
    if (noteInput.trim()) {
      const newNoteList = [...noteList, noteInput.trim()];
      setNoteList(newNoteList);
      setNoteInput('');
    }
  };

  const handleDeleteNote = (index) => {
    const newList = noteList.filter((_, i) => i !== index);
    setNoteList(newList);
  };

  const saveNotesToFirestore = async () => {
    try {
      const docRef = doc(db, 'notes', 'noteList');
      await setDoc(docRef, { notes: noteList, signature: noteSignature, name: noteName });
    } catch (error) {
      console.error('Error saving notes to Firestore:', error);
    }
  };

  const handleSaveAndExit = async () => {
    await saveNotesToFirestore();
    handleSaveNotes(); // This can be used for any additional logic when saving is complete.
  };

  const handleOpenSignatureModal = () => {
    setOpenSignatureModal(true);
  };

  const handleSign = () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setNoteSignature(signatureDataUrl);
    setOpenSignatureModal(false);
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
            <Button
              style={{ marginLeft: 15, marginTop: -14, borderRadius: 0, height: 50 }}
              variant="outlined"
              color="primary"
              onClick={handleAddNote}
            >
              Add
            </Button>
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
        <Button variant="contained" color="primary" onClick={handleSaveAndExit} sx={{ mt: 2 }}>
          Save and Exit
        </Button>
      </Box>

      <Modal
        open={openSignatureModal}
        onClose={() => setOpenSignatureModal(false)}
        aria-labelledby="signature-modal-title"
        aria-describedby="signature-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography id="signature-modal-title" variant="h6" component="h2" gutterBottom>
            Signature
          </Typography>
          <Box sx={{ width: '100%', height: 200, border: '1px solid #000' }}>
            <SignaturePad ref={sigPadRef} canvasProps={{ style: { width: '100%', height: '100%' } }} />
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="contained" color="primary" onClick={handleSign}>
              Sign
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default NotesComponent;
