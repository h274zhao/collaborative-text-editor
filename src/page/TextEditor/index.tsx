import { useEffect, useState, useRef, useCallback } from 'react';
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import TextEditor, { UserInfo } from "./textEditor";
import SideBar from '../../components/SideBar';

// MATERIAL UI
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

const drawerWidth = 240;

const ws_url = "ws://127.0.0.1:8000/editor"

export default function OTEditor(props: any) {
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [users, setUsers] = useState<Record<number, UserInfo>>({});
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
  const textEditor = useRef<TextEditor>();

  const updateUserList = useCallback((users: any) => setUsers(users), []);

  useEffect(() => {
    if (editor?.getModel()) {
      const model = editor.getModel()!;
      model.setValue("");
      model.setEOL(0);

      textEditor.current = new TextEditor({
        uri: `${ws_url}${props.ws}`,
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
            <SideBar users={users} />
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
            <SideBar users={users} />
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
    drawerPaper: {
      width: drawerWidth,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
  }),
);