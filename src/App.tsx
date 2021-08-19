import { useEffect, useState, useRef, useCallback } from 'react';
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import TextEditor, { UserInfo } from "./textEditor";
import useHash from "./useHash"
import './App.css';

// MATERIAL UI
import {
  AppBar,
  CssBaseline,
  Divider,
  Drawer,
  Hidden,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText ,
  Toolbar,
  Typography,
} from "@material-ui/core";
import PersonIcon from '@material-ui/icons/Person';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import './App.css';

const drawerWidth = 240;

//TO-DO: need to do change the code to match our own server implementation
function getWsUri(id: string) {
  const uri = 'ws://localhost:8000/editor';
  return uri;
}

export default function App() {
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [users, setUsers] = useState<Record<number, UserInfo>>({});
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
  const textEditor = useRef<TextEditor>();
  const id = useHash();

  const updateUserList = useCallback((users: any) => setUsers(users), []);

  useEffect(() => {
    if (editor?.getModel()) {
      const model = editor.getModel()!;
      model.setValue("");
      model.setEOL(0);

      textEditor.current = new TextEditor({
        uri: getWsUri(id),
        editor,
        onChangeUsers: updateUserList
      })
    }
  }, [editor, setUsers])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            <div style={{ display: 'flex' }}>
              OpenText Collaborative Editor
            </div>
          </Typography>
        </Toolbar>
      </AppBar>
      <nav className={classes.drawer} aria-label="mailbox folders">
        <Hidden smUp implementation="css">
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            classes={{ paper: classes.drawerPaper }}
            ModalProps={{ keepMounted: true }}
          >
            <div>
              <div className={classes.toolbar} />
              <Divider />
              <List>
                {Object.entries(users).map(([id, info]) => (
                  <ListItem button key={id}>
                    <ListItemIcon><PersonIcon style={{
                      backgroundColor: '#3f51b5',
                      borderRadius: '50%',
                      width: 30,
                      height: 30,
                      color: 'white',
                    }} /></ListItemIcon>
                    <ListItemText primary={info.name} />
                  </ListItem>
                ))}
              </List>
            </div>
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
            classes={{
              paper: classes.drawerPaper,
            }}
            variant="permanent"
            open
          >
            <div>
              <div className={classes.toolbar} />
              <Divider />
              <List>
                {Object.entries(users).map(([id, info]) => (
                  <ListItem button key={id}>
                    <ListItemIcon><PersonIcon style={{
                      backgroundColor: '#3f51b5',
                      borderRadius: '50%',
                      width: 30,
                      height: 30,
                      color: 'white',
                    }} /></ListItemIcon>
                    <ListItemText primary={info.name} />
                  </ListItem>
                ))}
              </List>
            </div>
          </Drawer>
        </Hidden>
      </nav>
      <div className="App">
        <div className="editor">
          <Editor
            onMount={(editor) => setEditor(editor)}
          />
        </div>
      </div>
    </div>
  );
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: drawerWidth,
        flexShrink: 0,
      },
    },
    appBar: {
      [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
      },
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    // necessary for content to be below app bar
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
      width: drawerWidth,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
  }),
);
