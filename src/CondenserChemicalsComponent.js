import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import {
  Box, TextField, Button, Modal, Typography, useMediaQuery
} from '@mui/material';
import TableComponent from './TableComponent';

const CondenserChemicalsComponent = ({ updateData, technicianName, setTechnicianName, noteSignature, setNoteSignature, handleOpenSignatureModal }) => {
  const [condenserChemicalsData, setCondenserChemicalsData] = useState([]);
  const condenserChemicalsLabels = [
    'PM3601 (25Kg)', 'Biocide AQ', 'PF CC6202 (20Kg)', 'PDV Salt (25Kg)', 'Sodium Hypochlorite (25 kg)',
    'BD 250C (25Kg)', 'PF CL4015 (CHW)', 'BD 350 (30Kg)', 'Dip slide (pcs)'
  ];
  const condenserChemicalsColumns = ['Opening Stock (Kg)', 'Closing Stock (Kg)', 'Consumption (Kg)'];
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const sigPadRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'condenserChemicals1'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCondenserChemicalsData(data);

        const docRef = doc(db, 'condenserChemicals1', 'metadata');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const { name, signature } = docSnap.data();
          setTechnicianName(name || '');
          setNoteSignature(signature || '');
        }
      } catch (error) {
        console.error('Error fetching condenser chemicals data:', error);
      }
    };
    fetchData();
  }, [setTechnicianName, setNoteSignature]);

  useEffect(() => {
    updateData('condenserChemicals1', condenserChemicalsData);
  }, [condenserChemicalsData, updateData]);

  const openLocalSignatureModal = () => {
    setOpenSignatureModal(true);
  };

  const handleSign = async () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setNoteSignature(signatureDataUrl);

    await setDoc(doc(db, 'condenserChemicals1', 'metadata'), {
      name: technicianName,
      signature: signatureDataUrl,
    });

    setOpenSignatureModal(false);
  };

  return (
    <>
      <TableComponent
        collectionName="condenserChemicals1"
        rowLabels={condenserChemicalsLabels}
        columnLabels={condenserChemicalsColumns}
        defaultRows={condenserChemicalsData}
        updateData={updateData}
      />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 3 }}>
        <TextField
          label="Name"
          value={technicianName}
          onChange={(e) => setTechnicianName(e.target.value)}
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
          onClick={openLocalSignatureModal}
        >
          {noteSignature ? (
            <img src={noteSignature} alt="Signature" style={{ width: '100px', height: '50px' }} />
          ) : (
            'Sign'
          )}
        </Box>
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

export default CondenserChemicalsComponent;
