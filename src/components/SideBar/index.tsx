import { UserInfo } from "../../page/TextEditor/textEditor";

import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import PersonIcon from '@material-ui/icons/Person';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    toolbar: theme.mixins.toolbar,
  }),
);

type Props = {
  users: Record<number, UserInfo>,
}

export default function Drawer(props: Props) {
  const classes = useStyles();

  return (
    <div>
      <div className={classes.toolbar} />
      <Divider />
      <List>
        {Object.entries(props.users).map(([id, info]) => (
          <ListItem button key={id}>
            <ListItemIcon>
              <PersonIcon style={{
                backgroundColor: '#3f51b5',
                borderRadius: '50%',
                width: 30,
                height: 30,
                color: 'white',
              }}/>
              </ListItemIcon>
            <ListItemText primary={info.name} />
          </ListItem>
        ))}
      </List>
    </div>
  );
}