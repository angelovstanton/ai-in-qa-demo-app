import React from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { ServiceRequest, User } from '../../types';

interface CommunityFeedbackSectionProps {
  request: ServiceRequest;
  user: User | null;
  hasUpvoted: boolean;
  upvoteCount: number;
  isUpvoting: boolean;
  showCommentForm: boolean;
  onUpvote: () => void;
  onToggleCommentForm: () => void;
}

const CommunityFeedbackSection: React.FC<CommunityFeedbackSectionProps> = ({
  request,
  user,
  hasUpvoted,
  upvoteCount,
  isUpvoting,
  showCommentForm,
  onUpvote,
  onToggleCommentForm,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
      <Typography variant="h6">
        Community Feedback
      </Typography>
      <Tooltip title={
        request.creator.id === user?.id 
          ? "You cannot upvote your own request" 
          : hasUpvoted 
            ? "Remove upvote" 
            : "Upvote this request"
      }>
        <span>
          <Button
            variant={hasUpvoted ? "contained" : "outlined"}
            color="primary"
            startIcon={hasUpvoted ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
            onClick={onUpvote}
            disabled={isUpvoting || request.creator.id === user?.id}
            data-testid="cs-request-upvote-button"
            sx={{ minWidth: 120 }}
          >
            {upvoteCount} {upvoteCount === 1 ? 'Upvote' : 'Upvotes'}
          </Button>
        </span>
      </Tooltip>
      
      <Button
        variant="outlined"
        startIcon={<CommentIcon />}
        onClick={onToggleCommentForm}
        data-testid="cs-request-comment-button"
      >
        Add Comment
      </Button>
    </Box>
  );
};

export default CommunityFeedbackSection;