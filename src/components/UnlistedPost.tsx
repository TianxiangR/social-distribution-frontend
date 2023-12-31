import React, {useState} from 'react';
import './Post.css';
import { Typography, Button, IconButton, Menu, MenuItem, Divider, Avatar, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { AuthorInfo, PostBrief } from '../types';
import CreatePost from './CreatePost';
import { deletePost, sharePost } from '../apis';
import ReactMarkDown from 'react-markdown';
import { getTimeDiffString } from '../utils';
import SharePostDialog from './SharePostDialog';

export interface PostProps extends PostBrief {
  onBodyClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCommentIconClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onLikeIconClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onShareIconClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onItemChanged?: () => void;
  onItemDeleted?: () => void;
}

function UnlistedPost(props: PostProps) {
  const {
    id, 
    title, 
    content, 
    published,
    visibility,
    contentType,
    author,
    is_my_post,
    html_url: image_url,
    unlisted,
    onItemChanged,
    onItemDeleted,
    onCommentIconClick,
    onLikeIconClick,
  } = props;
  // MUI Menu Sample Code: https://codesandbox.io/s/p7r69v?file=/src/Demo.tsx:486-559
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const timeDiffString = getTimeDiffString(new Date(published));
  const paragraphs = content.split('\n');
  const [isEditing, setIsEditing] = useState(false);
  const postEditDefaultValue = {id, title, content, visibility, contentType, unlisted};
  const [snackbarOpen, setSnackBarOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // prevent click event from being triggered when selecting text
    //source: https://stackoverflow.com/questions/31982407/prevent-onclick-event-when-selecting-text
    if (!window.getSelection()?.toString())
    {
      props.onBodyClick?.(e);
    }     
  };


  const handleCommentIconClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onCommentIconClick?.(e);
  };

  const handleLikeIconClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onLikeIconClick?.(e);
  };

  const handleSettingClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleEditClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setAnchorEl(null);
  };

  let postContent = <></>;

  if (contentType === 'text/plain')
  {
    postContent = 
    <>
      {paragraphs.map((item, idx) => {
        if (idx != paragraphs.length - 1) {
          return (
            <>
              <Typography key={idx} variant="body1" sx={{ fontWeight: 300 }}>
                {item}
              </Typography>
              <br />
            </>
          );
        }
        return (
          <Typography key={idx} variant="body1" sx={{ fontWeight: 300 }}>
            {item}
          </Typography>);
      })}
    </>;
  }
  else if (contentType === 'text/markdown')
  {
    postContent = <ReactMarkDown>{content}</ReactMarkDown>;
  }
  else if (contentType === 'image')
  {
    postContent = <img src={image_url} style={{maxWidth: '100%', height: 'auto'}}/>;
  }

  const handleDeleteClick = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
    const response = await deletePost(id);
    if (response.ok)
    {
      onItemDeleted?.();
    }
  };

  const handleUpdatePost = () => {
    setIsEditing(false);
    onItemChanged?.();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleShareIconClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (unlisted)
    {
      navigator.clipboard.writeText(image_url || '');
      setSnackBarOpen(true);
    }
    else
    {
      setShareDialogOpen(true);
    }
  };

  const sharePostSubmit = async (selectedUsers: AuthorInfo[]) => {
    const response = await sharePost({
      targets: selectedUsers,
      post: {
        id,
        title,
        content,
        contentType,
        visibility,
        unlisted,
        html_url: image_url,
        author,
      }
    });

    if (response.ok)
    {
      setShareDialogOpen(false);
    }
  };

  const postBody = (
    <>
      <div className='post-container' onClick={handleBodyClick}>
        {
          is_my_post && (props.onItemChanged || props.onItemDeleted) &&
        <div className='setting-container'>
          <IconButton size="small" onClick={handleSettingClick} data-testid="button-settings">
            <MoreHorizIcon />
          </IconButton>
          <Menu
            onClose={handleCloseMenu}
            anchorEl={anchorEl}
            open={menuOpen}
          >
            {props.onItemChanged && <MenuItem onClick={handleEditClick} data-testid="button-edit-post">Edit</MenuItem> }
            {props.onItemDeleted && <MenuItem onClick={handleDeleteClick} sx={{ color: 'red' }} data-testid="button-delete-post">Delete</MenuItem>}
          </Menu>
        </div>
        }
        <Avatar src={author.profileImage || undefined} alt={author.displayName}  sx={{width: '40px', height: '40px'}} />
        <div className='content-container'>
          <span style={{ display: 'flex', flexDirection: 'row', gap: '2px' }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {author.displayName}
            </Typography>
            <Typography variant="body1">
              {' · ' + timeDiffString}
            </Typography>
            <Typography variant="body1">
              {`(${visibility})`}
            </Typography>
          </span>
          <Typography variant="h5" sx={{ paddingBottom: 'px' }}>
            {title}
          </Typography>
          <Divider sx={{ margin: '10px 0' }} />
          {postContent}
          <div className='bottom-icons-container'>
            <span className='cell-container'>
              <>
                <Button variant='text' size='small' startIcon={<ContentCopyIcon />} onClick={handleShareIconClick} />
              </>
            </span>
          </div>
        </div>
      </div>
      <Snackbar
        message="Copied to clibboard"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={2000}
        onClose={() => setSnackBarOpen(false)}
        open={snackbarOpen}
      />
      <SharePostDialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} onSubmit={sharePostSubmit} />
    </>
  );
  
  return isEditing ?
    <div className='create-post-container'>
      <CreatePost onSubmitted={handleUpdatePost} onCancel={handleCancelEdit} defaultValue={postEditDefaultValue}/>
    </div>
    : postBody;
}

export default UnlistedPost;