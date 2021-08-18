import { useEffect, useState, useRef, useCallback } from 'react';
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import TextEditor, { UserInfo } from "./textEditor";
import useHash from "./useHash"
import './App.css';

// MATERIAL UI
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import PersonIcon from '@material-ui/icons/Person';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import './App.css';

const drawerWidth = 240;

function getWsUri(id: string) {
  return (
    /*(window.location.origin.startsWith("https") ? "wss://" : "ws://") +
    window.location.host +
    `/api/socket/${id}`*/
    'ws://localhost:8000/editor'
  );
}

export default function App() {
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [users, setUsers] = useState<Record<number, UserInfo>>({});
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
  const [, updateState] = useState({});
  const textEditor = useRef<TextEditor>();
  const id = useHash();

  const forceUpdate = useCallback(() => updateState({}), []);

  useEffect(() => {
    if (editor?.getModel()) {
      const model = editor.getModel()!;
      model.setValue("");
      model.setEOL(0);

      textEditor.current = new TextEditor({
        uri: getWsUri(id),
        editor,
        onChangeUsers: setUsers
      })

      const ws = new WebSocket(getWsUri(id));

      const curr = textEditor.current

      if (curr) {
        ws.onopen = () => {
          curr.connecting = false;
          curr.ws = ws;
          curr.sendInfo();
          ws.send("This is a new connection");
        };
        ws.onclose = () => {
          if (curr.ws) {
            curr.ws = undefined;
            if (++curr.recentFailures >= 5) {
              // If we disconnect 5 times within 15 reconnection intervals, then the
              // client is likely desynchronized and needs to refresh.
              curr.dispose();
              curr.options.onDesynchronized?.();
            }
          } else {
            curr.connecting = false;
          }
        };
        ws.onmessage = ({ data }) => {
          try {
            const json = JSON.parse(data);
            curr.users = {}
            json.users.forEach((user: string, i: number) => {
              let userInfo: UserInfo = {
                name: user
              };
              curr.users[i] = userInfo;
            });
            setUsers(curr.users);
            forceUpdate()
          }
          catch (e) {
            if (data === "This is a new connection") {
              ws.send(curr.model.getValue());
            }
            else if (data !== curr.model.getValue()) {
              curr.model.setValue(data);
            }
          }
          curr.ignoreChanges = false;
        }
      }
    }
  }, [editor, setUsers])


  useEffect(() => {
    console.log(users)
  }, [users, textEditor.current?.users])


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
            onChange={() => {
              console.log("hiu")
              if (textEditor.current?.users)
                setUsers(textEditor.current?.users)
            }}
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