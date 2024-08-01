import React, { useEffect, useState, useRef } from 'react';
import {
  Container, Box, Tabs, Tab, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  createTheme, ThemeProvider, Modal, Typography, Grid, useMediaQuery,
  List, ListItem, ListItemText, IconButton, Divider, Chip
} from '@mui/material';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import logo from './logo.png';  // Replace with the actual path to your logo
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    background: { default: '#f8f9fa', paper: '#fff' },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h5: { fontSize: '1.5rem' },
    h6: { fontSize: '1.2rem' },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.8rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: '16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '20px',
          borderRadius: '10px',
        },
      },
    },
  },
});

const TabPanel = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const TableComponent = ({ collectionName, rowLabels, columnLabels, defaultRows, updateData }) => {
  const [rows, setRows] = useState(defaultRows || []);
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const [currentColumn, setCurrentColumn] = useState(null);
  const sigPadRef = useRef(null);
  const [openLevel, setOpenLevel] = useState("8.2");
  const [closeLevel, setCloseLevel] = useState("7.8");
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (!defaultRows) setRows(data);
    };
    fetchData();
  }, [collectionName, defaultRows]);

  useEffect(() => {
    updateData(collectionName, rows);
  }, [rows, updateData, collectionName]);

  const handleChange = (e, rowIndex, columnKey) => {
    const newRows = [...rows];
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = {};
    }
    newRows[rowIndex][columnKey] = e.target.value;
    if (columnKey === 'Consumption (Kg)') {
      const openingStock = parseFloat(newRows[rowIndex]['Opening Stock (Kg)']) || 0;
      const consumption = parseFloat(e.target.value) || 0;
      newRows[rowIndex]['Closing Stock (Kg)'] = (openingStock - consumption).toFixed(2);
    }
    setRows(newRows);
  };

  const handleSave = async () => {
    for (const row of rows) {
      const rowDoc = doc(db, collectionName, row.id || rowLabels[rows.indexOf(row)]);
      await setDoc(rowDoc, row);
    }
    alert('Data saved successfully!');
  };

  const handleOpenSignatureModal = (rowIndex, columnKey) => {
    setCurrentRow(rowIndex);
    setCurrentColumn(columnKey);
    setOpenSignatureModal(true);
  };

  const handleSign = async () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    const newRows = [...rows];
    if (!newRows[currentRow]) {
      newRows[currentRow] = {};
    }
    newRows[currentRow][currentColumn] = signatureDataUrl;
    setRows(newRows);

    const rowDoc = doc(db, collectionName, newRows[currentRow].id || rowLabels[currentRow]);
    await setDoc(rowDoc, newRows[currentRow]);

    setOpenSignatureModal(false);
  };

  const renderRowAsList = (rowLabel, rowIndex) => (
    <Box key={rowIndex} sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{rowLabel}</Typography>
      {columnLabels.map((col, colIndex) => (
        col !== 'Signature' && (
          <Box key={colIndex} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>{col}:</Typography>
            <TextField
              value={rows[rowIndex]?.[col] || ''}
              onChange={(e) => handleChange(e, rowIndex, col)}
              InputProps={{ sx: { padding: 0, height: '56px' } }}
              sx={{ flex: 2 }}
              variant="standard"
            />
          </Box>
        )
      ))}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ flex: 1 }}>Signature:</Typography>
        <div
          onClick={() => handleOpenSignatureModal(rowIndex, 'Signature')}
          style={{ cursor: 'pointer', border: '1px solid #000', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 2 }}
        >
          {rows[rowIndex]?.['Signature'] ? (
            <img src={rows[rowIndex]?.['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
          ) : (
            'Sign'
          )}
        </div>
      </Box>
      <Divider />
    </Box>
  );


  return (
    <>
      {isMobile ? (
        <List>
          {rowLabels.map((rowLabel, rowIndex) => renderRowAsList(rowLabel, rowIndex))}
        </List>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', mb: 3 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>
                  {collectionName === 'chilledWater' ? 'Date' : 'Product Name'} {/* Conditional label */}
                </TableCell>
                {columnLabels.map((col, index) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {collectionName === 'condenserWater' && (
                <TableRow>
                  <TableCell sx={{ padding: '8px' }}>Blowdown Set-point</TableCell>
                  <TableCell colSpan={columnLabels.length - 1} sx={{ padding: '8px', textAlign: 'center' }}>
                    Open Level <TextField value={openLevel} onChange={(e) => setOpenLevel(e.target.value)} sx={{ width: '50px', padding: 0, height: '56px' }} InputProps={{ sx: { padding: 0, height: '56px' } }} /> &
                    Close Level <TextField value={closeLevel} onChange={(e) => setCloseLevel(e.target.value)} sx={{ width: '50px', padding: 0, height: '56px' }} InputProps={{ sx: { padding: 0, height: '56px' } }} />
                  </TableCell>
                </TableRow>
              )}
              {rowLabels.map((rowLabel, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow>
                    <TableCell sx={{ padding: '8px' }}>{rowLabel}</TableCell>
                    {collectionName === 'chilledWater' ? (
                      <>
                        <TableCell sx={{ padding: '8px' }}>
                          <TextField
                            value={rows[rowIndex]?.['Conductivity'] || ''}
                            onChange={(e) => handleChange(e, rowIndex, 'Conductivity')}
                            InputProps={{ sx: { padding: 0, height: '56px' } }}
                          />
                        </TableCell>
                      </>
                    ) : (
                      columnLabels.map((col, colIndex) => (
                        col === 'Signature' ? (
                          <TableCell sx={{ padding: '8px', display: 'flex', justifyContent: 'center', height: '56px' }}>
                            <div
                              onClick={() => handleOpenSignatureModal(rowIndex, 'Signature')}
                              style={{ cursor: 'pointer', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}
                            >
                              {rows[rowIndex]?.['Signature'] ? (
                                <img src={rows[rowIndex]['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
                              ) : (
                                'Sign'
                              )}
                            </div>
                          </TableCell>
                        ) : (
                          <TableCell key={colIndex} sx={{ padding: '8px' }}>
                            {col === 'Closing Stock (Kg)' ? (
                              <TextField
                                value={rows[rowIndex]?.[col] || ''}
                                InputProps={{ sx: { padding: 0, height: '56px' }, readOnly: true }}
                              />
                            ) : (
                              <TextField
                                value={rows[rowIndex]?.[col] || ''}
                                onChange={(e) => handleChange(e, rowIndex, col)}
                                InputProps={{ sx: { padding: 0, height: '56px' } }}
                              />
                            )}
                          </TableCell>
                        )
                      ))
                    )}
                  </TableRow>
                  {collectionName === 'chilledWater' && (
                    <>
                      <TableRow>
                        <TableCell sx={{ padding: '8px' }}>Name</TableCell>
                        <TableCell sx={{ padding: '8px' }}>
                          <TextField
                            fullWidth
                            placeholder="Name"
                            value={rows[rowIndex]?.['Name'] || ''}
                            onChange={(e) => handleChange(e, rowIndex, 'Name')}
                            InputProps={{ sx: { height: '56px' } }}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ padding: '8px' }}>Signature</TableCell>
                        <TableCell sx={{ padding: '8px' }}>
                          <div
                            onClick={() => handleOpenSignatureModal(rowIndex, 'Signature')}
                            style={{ cursor: 'pointer', border: '1px solid #000', minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}
                          >
                            {rows[rowIndex]?.['Signature'] ? (
                              <img src={rows[rowIndex]['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
                            ) : (
                              'Sign'
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </React.Fragment>
              ))}

              {collectionName !== 'condenserWater' && collectionName !== 'chilledWater' && (
                <TableRow>
                  <TableCell colSpan={columnLabels.length}>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '56px' }}>
                      <TextField
                        fullWidth
                        placeholder="Name"
                        value={rows[rows.length - 1]?.['Name'] || ''}
                        onChange={(e) => handleChange(e, rows.length - 1, 'Name')}
                        sx={{ height: '100%' }}
                        InputProps={{ sx: { height: '100%' } }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <div
                      onClick={() => handleOpenSignatureModal(rows.length - 1, 'Signature')}
                      style={{ cursor: 'pointer', border: '1px solid #000', minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
                    >
                      {rows[rows.length - 1]?.['Signature'] ? (
                        <img src={rows[rows.length - 1]?.['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
                      ) : (
                        'Sign'
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Button variant="contained" color="primary" onClick={handleSave} sx={{ mt: 2 }}>
        Save
      </Button>
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
            border: '2px solid #000',
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

const Userform = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [reportDate, setReportDate] = useState(new Date());
  const [revisionDate, setRevisionDate] = useState(new Date());
  const [technicianName, setTechnicianName] = useState('');
  const [notes, setNotes] = useState('');
  const [noteList, setNoteList] = useState([]);
  const [noteName, setNoteName] = useState('');
  const [noteSignature, setNoteSignature] = useState('');
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const sigPadRef = useRef(null);

  useEffect(() => {
    const fetchNotes = async () => {
      const notesSnapshot = await getDocs(collection(db, 'notes'));
      const notesData = notesSnapshot.docs.map(doc => doc.data().notes);
      setNoteList(notesData.flat()); // Flatten the array if notes is an array of arrays
    };

    fetchNotes();
  }, []);

  const [noteInput, setNoteInput] = useState('');
  const [condenserWaterData, setCondenserWaterData] = useState([]);
  const [chilledWaterData, setChilledWaterData] = useState([]);
  const [condenserChemicalsData, setCondenserChemicalsData] = useState([]);
  const [coolingTowerChemicalsData, setCoolingTowerChemicalsData] = useState([]);
  const [additionalTableData, setAdditionalTableData] = useState([
    { label: 'Condenser water dip slide test result as of: 30th October 2022', value: '10²', color: 'blue' },
    { label: 'Chilled water dip slide test result as of: 02nd November 2022', value: '10²', color: 'blue' },
    { label: 'Condenser system Make-up (m³ / USG)', value: '5243', color: 'red' },
    { label: 'Condenser system Blowdown (m³ / USG)', value: '950', color: 'red' },
    { label: 'Chilled water system Make-up (m³ / USG)', value: '0.62', color: 'red' },
    { label: 'C.O.C based on conductivity (Condenser/Make-up)', value: '8.0', color: 'blue' },
    { label: 'C.O.C based on (CT make-up/CT blowdown)', value: '5.5', color: 'blue' },
    { label: 'MIOX Running Hours (Hr.)', value: '344.0 hrs.', color: 'black' },
  ]);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

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
    const notesDoc = doc(db, 'notes', 'notesList');
    await setDoc(notesDoc, { notes: noteList });
    alert('Notes saved successfully!');
  };

  const handleAdditionalTableChange = (e, index) => {
    const newTableData = [...additionalTableData];
    newTableData[index].value = e.target.value;
    setAdditionalTableData(newTableData);
  };

  const handleSaveAdditionalTable = async () => {
    const additionalDataDoc = doc(db, 'additionalTable', 'additionalTableData');
    await setDoc(additionalDataDoc, { data: additionalTableData });
    alert('Additional data saved successfully!');
  };

  const handleClearAllData = () => {
    setCondenserWaterData(condenserWaterLabels.map(label => ({})));
    setChilledWaterData(chilledWaterLabels.map(label => ({})));
    setCondenserChemicalsData(condenserChemicalsLabels.map(label => ({})));
    setCoolingTowerChemicalsData(coolingTowerChemicalsLabels.map(label => ({})));
    setAdditionalTableData(additionalTableData.map(item => ({ ...item, value: '' })));
  };

  const updateData = (collectionName, data) => {
    switch (collectionName) {
      case 'condenserWater':
        setCondenserWaterData(data);
        break;
      case 'chilledWater':
        setChilledWaterData(data);
        break;
      case 'condenserChemicals':
        setCondenserChemicalsData(data);
        break;
      case 'coolingTowerChemicals':
        setCoolingTowerChemicalsData(data);
        break;
      default:
        break;
    }
  };

  const handleSaveAllData = async () => {
    await handleSaveData('condenserWater', condenserWaterData, condenserWaterLabels);
    await handleSaveData('chilledWater', chilledWaterData, chilledWaterLabels);
    await handleSaveData('condenserChemicals', condenserChemicalsData, condenserChemicalsLabels);
    await handleSaveData('coolingTowerChemicals', coolingTowerChemicalsData, coolingTowerChemicalsLabels);
    await handleSaveAdditionalTable();
  };

  const handleSaveData = async (collectionName, data, rowLabels) => {
    for (const row of data) {
      const rowDoc = doc(db, collectionName, row.id || rowLabels[data.indexOf(row)]);
      await setDoc(rowDoc, row);
    }
  };

  const handleOpenSignatureModal = () => {
    setOpenSignatureModal(true);
  };

  const handleSign = async () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setNoteSignature(signatureDataUrl);
    setOpenSignatureModal(false);
  };

  const condenserWaterLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const condenserWaterColumns = ['Makeup Conductivity', 'Condenser Conductivity', 'Free Chlorine', 'Action', 'Name', 'Signature'];

  const chilledWaterLabels = [new Date().toLocaleDateString()];
  const chilledWaterColumns = ['Conductivity', 'Action'];
  const chilledWaterDefaultRow = {
    Day: new Date().toLocaleDateString(),
    Conductivity: '',
    Name: '',
    Signature: ''
  };

  const condenserChemicalsLabels = [
    'PM3601 (25Kg)', 'Biocide AQ', 'PF CC6202 (20Kg)', 'PDV Salt (25Kg)', 'Sodium Hypochlorite (25 kg)',
    'BD 250C (25Kg)', 'PF CL4015 (CHW)', 'BD 350 (30Kg)', 'Dip slide (pcs)'
  ];
  const condenserChemicalsColumns = ['Opening Stock (Kg)', 'Closing Stock (Kg)', 'Consumption (Kg)'];
  const condenserChemicalsDefaultRows = [
    { 'Product Name': 'PM3601 (25Kg)', 'Opening Stock (Kg)': 100, 'Consumption (Kg)': '', 'Closing Stock (Kg)': '' },
    { 'Product Name': 'Biocide AQ', 'Opening Stock (Kg)': 200, 'Consumption (Kg)': '', 'Closing Stock (Kg)': '' },
    { 'Product Name': 'PF CC6202 (20Kg)', 'Opening Stock (Kg)': 150, 'Consumption (Kg)': '', 'Closing Stock (Kg)': '' },
    { 'Product Name': 'PDV Salt (25Kg)', 'Opening Stock (Kg)': 300, 'Consumption (Kg)': '', 'Closing Stock (Kg)': '' },
    { 'Product Name': 'Sodium Hypochlorite (25 kg)', 'Opening Stock (Kg)': 250, 'Consumption (Kg)': '', 'Closing Stock (Kg)': '' },
    { 'Product Name': 'BD 250C (25Kg)', 'Opening Stock (Kg)': 180, 'Consumption (Kg)': '', 'Closing Stock (Kg)': '' },
    { 'Product Name': 'PF CL4015 (CHW)', 'Opening Stock (Kg)': 120, 'Consumption (Kg)': '', 'Closing Stock (Kg)': '' },
    { 'Product Name': 'BD 350 (30Kg)', 'Opening Stock (Kg)': 90, 'Consumption (Kg)': '', 'Closing Stock (Kg)': '' },
    { 'Product Name': 'Dip slide (pcs)', 'Opening Stock (Kg)': 60, 'Consumption (Kg)': '', 'Closing Stock (Kg)': '' }
  ];

  const coolingTowerChemicalsLabels = [
    'Hydrochloric Acid (25Kg)', 'Sodium Hypochlorite (25Kg)', 'Phosphoric Acid (35Kg)',
    'Expired CHW Chemicals', 'Expired CT Chemicals'
  ];
  const coolingTowerChemicalsColumns = ['Available empty Jerry Cans in plants (06-11-2022)'];
  const coolingTowerChemicalsDefaultRows = coolingTowerChemicalsLabels.map(label => ({
    'Product Name': label,
    'Available empty Jerry Cans in plants (06-11-2022)': ''
  }));

  return (
    <ThemeProvider theme={theme}>
      <Container component={Paper} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <img src={require('./logo.png')} alt="Logo" style={{ width: isMobile ? '50%' : '150px', marginBottom: '5px' }} />
          <Typography variant={isMobile ? 'h6' : 'h5'} component="h1">
            Water Treatment Weekly Report
          </Typography>
          <Typography variant={isMobile ? 'subtitle2' : 'subtitle1'} component="h2">
            Week Commencing Sunday : 28th July 2024 to 3rd August 2024
          </Typography>
          <Chip label="Plant Name: AD-002" color="primary" size="small" sx={{ mt: 0.5 }} />
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Operations Department: TOM-OPS-FM-2009</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Revision 03 Dated: 25/10/2021</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Replaces Revision 02 of: 19/03/2005</Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'right', mb: 3 }}>
          <Button variant="contained" color="primary" onClick={handleSaveAllData}>
            Submit report
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} centered>
            <Tab label="Condenser Water" />
            <Tab label="Chilled Water" />
            <Tab label="Condenser Chemicals" />
            <Tab label="Cooling Tower Chemicals" />
            <Tab label="Notes" />
          </Tabs>
        </Box>
        <TabPanel value={tabIndex} index={0}>
          <TableComponent
            collectionName="condenserWater"
            rowLabels={condenserWaterLabels}
            columnLabels={condenserWaterColumns}
            updateData={updateData}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <TableComponent
            collectionName="chilledWater"
            rowLabels={chilledWaterLabels}
            columnLabels={chilledWaterColumns}
            defaultRows={[chilledWaterDefaultRow]}
            updateData={updateData}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <TableComponent
            collectionName="condenserChemicals"
            rowLabels={condenserChemicalsLabels}
            columnLabels={condenserChemicalsColumns}
            defaultRows={condenserChemicalsDefaultRows}
            updateData={updateData}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={3}>
          <TableComponent
            collectionName="coolingTowerChemicals"
            rowLabels={coolingTowerChemicalsLabels}
            columnLabels={coolingTowerChemicalsColumns}
            defaultRows={coolingTowerChemicalsDefaultRows}
            updateData={updateData}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={4}>
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

              <ListItem>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <TextField
                    fullWidth
                    placeholder="Name"
                    value={noteName}
                    onChange={(e) => setNoteName(e.target.value)}
                    sx={{ mr: 2 }}
                  />
                  <div
                    onClick={handleOpenSignatureModal}
                    style={{ cursor: 'pointer', border: '1px solid #000', minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '56px' }}
                  >
                    {noteSignature ? (
                      <img src={noteSignature} alt="Signature" style={{ width: '100px', height: '50px' }} />
                    ) : (
                      'Sign'
                    )}
                  </div>
                </Box>
              </ListItem>

            </List>
            <Button variant="contained" color="primary" onClick={handleSaveNotes} sx={{ mt: 2 }}>
              Save Notes
            </Button>
          </Box>
        </TabPanel>
      </Container>
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
            border: '2px solid #000',
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
    </ThemeProvider>
  );
};

export default Userform;
