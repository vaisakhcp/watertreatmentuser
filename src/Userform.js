import React, { useEffect, useState, useRef } from 'react';
import {
  Container, Box, Tabs, Tab, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  createTheme, ThemeProvider, Modal, Typography, Grid, useMediaQuery,
  List, ListItem, ListItemText, IconButton, Divider, Chip, Fab
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import logo from './logo.png';
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
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px',
          fontSize: '14px',
        },
        head: {
          fontWeight: 'bold',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        subtitle1: {
          fontWeight: 'bold',
          color: '#666',
        },
        subtitle2: {
          fontWeight: 'bold',
          color: '#999',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    background: { default: '#424242', paper: '#333' },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h5: { fontSize: '1.5rem' },
    h6: { fontSize: '1.2rem' },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.8rem' },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px',
          fontSize: '14px',
        },
        head: {
          fontWeight: 'bold',
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

const TableComponent = ({ collectionName, rowLabels, columnLabels, defaultRows, updateData, calculateClosingStock }) => {
  const [rows, setRows] = useState(defaultRows || []);
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const [currentColumn, setCurrentColumn] = useState(null);
  const sigPadRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`Fetched data for ${collectionName}:`, data);
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
    if (calculateClosingStock && columnKey !== 'Closing Stock (Kg)') {
      const openingStock = parseFloat(newRows[rowIndex]['Opening Stock (Kg)'] || 0);
      const consumption = parseFloat(newRows[rowIndex]['Consumption (Kg)'] || 0);
      newRows[rowIndex]['Closing Stock (Kg)'] = openingStock - consumption;
    }
    setRows(newRows);
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
    console.log(`Saving signature document in ${collectionName} collection:`, newRows[currentRow]);
    await setDoc(rowDoc, newRows[currentRow]);

    setOpenSignatureModal(false);
  };

  return (
    <>
      {isMobile ? (
        <List>
          {rowLabels.map((rowLabel, rowIndex) => (
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
                      disabled={col === 'Closing Stock (Kg)'}
                    />
                  </Box>
                )
              ))}
              {columnLabels.includes('Signature') && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>Signature:</Typography>
                  <div
                    onClick={() => handleOpenSignatureModal(rowIndex, 'Signature')}
                    style={{ cursor: 'pointer', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 2 }}
                  >
                    {rows[rowIndex]?.['Signature'] ? (
                      <img src={rows[rowIndex]?.['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
                    ) : (
                      'Sign'
                    )}
                  </div>
                </Box>
              )}
              <Divider />
            </Box>
          ))}
        </List>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', mb: 3 }}>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>Date</TableCell>
                {columnLabels.map((col, index) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rowLabels.map((rowLabel, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow>
                    <TableCell sx={{ padding: '8px' }}>{rowLabel}</TableCell>
                    {columnLabels.map((col, colIndex) => (
                      col === 'Signature' ? (
                        <TableCell key={colIndex} sx={{ padding: '8px', display: 'flex', justifyContent: 'center', height: '56px' }}>
                          <div
                            onClick={() => handleOpenSignatureModal(rowIndex, 'Signature')}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}
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
                          <TextField
                            value={rows[rowIndex]?.[col] || ''}
                            onChange={(e) => handleChange(e, rowIndex, col)}
                            InputProps={{ sx: { padding: 0, height: '56px' } }}
                            disabled={col === 'Closing Stock (Kg)'}
                          />
                        </TableCell>
                      )
                    ))}
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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
  const [chilledWaterData, setChilledWaterData] = useState({});
  const [condenserChemicalsData, setCondenserChemicalsData] = useState([]);
  const [coolingTowerChemicalsData, setCoolingTowerChemicalsData] = useState([]);
  const [additionalTableData, setAdditionalTableData] = useState([
    { label: 'Condenser water dip slide test result as of: 30th October 2022', value: '', color: 'blue' },
    { label: 'Chilled water dip slide test result as of: 02nd November 2022', value: '', color: 'blue' },
    { label: 'Condenser system Make-up (m³ / USG)', value: '', color: 'red' },
    { label: 'Condenser system Blowdown (m³ / USG)', value: '', color: 'red' },
    { label: 'Chilled water system Make-up (m³ / USG)', value: '', color: 'red' },
    { label: 'C.O.C based on conductivity (Condenser/Make-up)', value: '', color: 'blue' },
    { label: 'C.O.C based on (CT make-up/CT blowdown)', value: '', color: 'blue' },
    { label: 'MIOX Running Hours (Hr.)', value: '', color: 'black' },
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
    const notesDoc = doc(db, 'notes', 'noteList');
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
        console.log('condenserWater', data);

        break;
      case 'chilledWater':
        console.log('data', data);

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
    await handleSaveData('chilledWater', [chilledWaterData], chilledWaterLabels); // Pass as array
    await handleSaveData('condenserChemicals', condenserChemicalsData, condenserChemicalsLabels);
    await handleSaveData('coolingTowerChemicals', coolingTowerChemicalsData, coolingTowerChemicalsLabels);
    await handleSaveAdditionalTable();
    await handleSaveNotes();
  };
  
  const handleSaveData = async (collectionName, data, rowLabels) => {
    console.log('dasdasda'+ collectionName,data)
    if (!Array.isArray(data)) {
      data = [data]; // Convert to an array if it is not
    }
    for (const row of data) {
      const rowDoc = doc(db, collectionName, row.id || rowLabels[data.indexOf(row)]);
      console.log(`Saving document in ${collectionName} collection:`, row);
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
  const chilledWaterDefaultRow = [{
    'Day': new Date().toLocaleDateString(),
    'Conductivity': '',
    'Name': '',
    'Signature': ''
  }]
  const condenserChemicalsLabels = [
    'PM3601 (25Kg)', 'Biocide AQ', 'PF CC6202 (20Kg)', 'PDV Salt (25Kg)', 'Sodium Hypochlorite (25 kg)',
    'BD 250C (25Kg)', 'PF CL4015 (CHW)', 'BD 350 (30Kg)', 'Dip slide (pcs)'
  ];
  const condenserChemicalsColumns = ['Opening Stock (Kg)', 'Consumption (Kg)', 'Closing Stock (Kg)'];
  const condenserChemicalsDefaultRows = [
    { 'Product Name': 'PM3601 (25Kg)', 'Opening Stock (Kg)': 100, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 100 },
    { 'Product Name': 'Biocide AQ', 'Opening Stock (Kg)': 200, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 200 },
    { 'Product Name': 'PF CC6202 (20Kg)', 'Opening Stock (Kg)': 150, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 150 },
    { 'Product Name': 'PDV Salt (25Kg)', 'Opening Stock (Kg)': 300, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 300 },
    { 'Product Name': 'Sodium Hypochlorite (25 kg)', 'Opening Stock (Kg)': 250, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 250 },
    { 'Product Name': 'BD 250C (25Kg)', 'Opening Stock (Kg)': 180, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 180 },
    { 'Product Name': 'PF CL4015 (CHW)', 'Opening Stock (Kg)': 120, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 120 },
    { 'Product Name': 'BD 350 (30Kg)', 'Opening Stock (Kg)': 90, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 90 },
    { 'Product Name': 'Dip slide (pcs)', 'Opening Stock (Kg)': 60, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 60 }
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

  const ChilledWaterForm = ({ chilledWaterData, setChilledWaterData, handleSave }) => {
    const [data, setData] = useState(chilledWaterData);
    const sigPadRef = useRef(null);
    const [openSignatureModal, setOpenSignatureModal] = useState(false);
  
    const handleChange = (e, field) => {
      setData({ ...data, [field]: e.target.value });
      setChilledWaterData({ ...chilledWaterData, [field]: e.target.value });
    };
  
    const handleOpenSignatureModal = () => {
      setOpenSignatureModal(true);
    };
  
    const handleSign = () => {
      const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
      setData({ ...data, Signature: signatureDataUrl });
      setOpenSignatureModal(false);
    };
  
    return (
      <Box>
        <TextField
          label="Day"
          value={data.Day || ''}
          onChange={(e) => handleChange(e, 'Day')}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Conductivity"
          value={data.Conductivity || ''}
          onChange={(e) => handleChange(e, 'Conductivity')}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Action"
          value={data.Action || ''}
          onChange={(e) => handleChange(e, 'Action')}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3 }}>
          <TextField
            label="Name"
            value={data.Name || ''}
            onChange={(e) => handleChange(e, 'Name')}
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
              marginTop: -2
            }}
            onClick={handleOpenSignatureModal}
          >
            {data.Signature ? (
              <img src={data.Signature} alt="Signature" style={{ width: '100px', height: '50px' }} />
            ) : (
              'Sign'
            )}
          </Box>
        </Box>
      </Box>
    );
  };

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
          <Tabs value={tabIndex} onChange={handleTabChange} centered variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
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
          <ChilledWaterForm
            chilledWaterData={chilledWaterData}
            setChilledWaterData={setChilledWaterData}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <TableComponent
            collectionName="condenserChemicals"
            rowLabels={condenserChemicalsLabels}
            columnLabels={condenserChemicalsColumns}
            defaultRows={condenserChemicalsDefaultRows}
            updateData={updateData}
            calculateClosingStock
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
              onClick={handleOpenSignatureModal}
            >
              {noteSignature ? (
                <img src={noteSignature} alt="Signature" style={{ width: '100px', height: '50px' }} />
              ) : (
                'Sign'
              )}
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={tabIndex} index={3}>
          <TableComponent
            collectionName="coolingTowerChemicals"
            rowLabels={coolingTowerChemicalsLabels}
            columnLabels={coolingTowerChemicalsColumns}
            defaultRows={coolingTowerChemicalsDefaultRows}
            updateData={updateData}
          />
          <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
            <Table>
              <TableBody>
                {additionalTableData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>
                      {index < 2 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">10<sup></sup></Typography> {/* Superscript using <sup> tag */}
                          <TextField
                            value={item.value}
                            onChange={(e) => handleAdditionalTableChange(e, index)}
                            sx={{ width: '56px', ml: 1 }} // Adjust width as needed
                            InputProps={{
                              inputProps: { style: { textAlign: 'center' } }
                            }}
                          />
                        </Box>
                      ) : (
                        <TextField
                          value={item.value}
                          onChange={(e) => handleAdditionalTableChange(e, index)}
                          fullWidth
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
          </Box>
        </TabPanel>
      </Container>
      <Fab
        color="primary"
        aria-label="save"
        onClick={handleSaveAllData}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <SaveIcon />
      </Fab>
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
