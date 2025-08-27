import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ImageUpload from '../../components/ImageUpload';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File constructor
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(bits: BlobPart[], filename: string, options: FilePropertyBag = {}) {
    this.name = filename;
    this.size = options.size || bits.join('').length;
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
} as any;

describe('ImageUpload', () => {
  const mockOnImagesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the upload area', () => {
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      expect(screen.getByTestId('cs-image-upload')).toBeInTheDocument();
      expect(screen.getByText('Image Upload')).toBeInTheDocument();
      expect(screen.getByTestId('cs-image-upload-dropzone')).toBeInTheDocument();
    });

    it('should render drag and drop instructions', () => {
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      expect(screen.getByText('Drag & drop images or click to browse')).toBeInTheDocument();
      expect(screen.getByText(/Supports JPEG and PNG files/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum 5 images allowed/)).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(
        <TestWrapper>
          <ImageUpload
            onImagesChange={mockOnImagesChange}
            maxImages={3}
            maxSizePerImage={2 * 1024 * 1024}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Maximum 3 images allowed/)).toBeInTheDocument();
      expect(screen.getByText(/up to 2MB each/)).toBeInTheDocument();
    });

    it('should render file input with correct attributes', () => {
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const fileInput = screen.getByTestId('cs-image-upload-input');
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/jpg,image/png');
    });
  });

  describe('File Selection', () => {
    it('should handle file selection via input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      });
    });

    it('should handle multiple file selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} maxImages={3} />
        </TestWrapper>
      );

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg', size: 1024 }),
        new File(['test2'], 'test2.png', { type: 'image/png', size: 2048 }),
      ];
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, files);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      });
    });

    it('should handle drag and drop', async () => {
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const dropzone = screen.getByTestId('cs-image-upload-dropzone');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });

      fireEvent.dragOver(dropzone);
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      });
    });

    it('should update drag state on drag events', () => {
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const dropzone = screen.getByTestId('cs-image-upload-dropzone');

      fireEvent.dragOver(dropzone);
      expect(screen.getByText('Drop images here')).toBeInTheDocument();

      fireEvent.dragLeave(dropzone);
      expect(screen.getByText('Drag & drop images or click to browse')).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('should reject files that are too large', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} maxSizePerImage={1024} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 2048 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('cs-image-upload-error')).toBeInTheDocument();
        expect(screen.getByText(/File size must be less than/)).toBeInTheDocument();
      });
    });

    it('should reject files with invalid types', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.txt', { type: 'text/plain', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('cs-image-upload-error')).toBeInTheDocument();
        expect(screen.getByText(/Only.*files are allowed/)).toBeInTheDocument();
      });
    });

    it('should reject when exceeding maximum images', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} maxImages={1} />
        </TestWrapper>
      );

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg', size: 1024 }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg', size: 1024 }),
      ];
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByTestId('cs-image-upload-error')).toBeInTheDocument();
        expect(screen.getByText(/Maximum 1 images allowed/)).toBeInTheDocument();
      });
    });

    it('should accept valid files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.queryByTestId('cs-image-upload-error')).not.toBeInTheDocument();
        expect(mockOnImagesChange).toHaveBeenCalled();
      });
    });
  });

  describe('Image Management', () => {
    it('should display uploaded images', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('cs-image-upload-grid')).toBeInTheDocument();
        expect(screen.getByText('Uploaded Images (1/5)')).toBeInTheDocument();
      });
    });

    it('should allow removing images', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        const imageItem = screen.getByTestId(/cs-image-item-/);
        expect(imageItem).toBeInTheDocument();
      });

      // Find and click the delete button
      const deleteButton = screen.getByTestId(/cs-image-delete-/);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByTestId(/cs-image-item-/)).not.toBeInTheDocument();
      });
    });

    it('should open preview dialog when image is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        const imageItem = screen.getByTestId(/cs-image-item-/);
        expect(imageItem).toBeInTheDocument();
      });

      const imageItem = screen.getByTestId(/cs-image-item-/);
      await user.click(imageItem);

      await waitFor(() => {
        expect(screen.getByTestId('cs-image-preview-dialog')).toBeInTheDocument();
      });
    });

    it('should close preview dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        const imageItem = screen.getByTestId(/cs-image-item-/);
        expect(imageItem).toBeInTheDocument();
      });

      const imageItem = screen.getByTestId(/cs-image-item-/);
      await user.click(imageItem);

      await waitFor(() => {
        expect(screen.getByTestId('cs-image-preview-dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('cs-image-preview-close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('cs-image-preview-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Upload Simulation', () => {
    it('should simulate upload progress', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      // The upload simulation should show progress and then success
      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should show upload status chips', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        // Should show either uploading or success status
        const statusChips = screen.getAllByText(/uploading|success/i);
        expect(statusChips.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper test IDs for all interactive elements', () => {
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      expect(screen.getByTestId('cs-image-upload')).toBeInTheDocument();
      expect(screen.getByTestId('cs-image-upload-dropzone')).toBeInTheDocument();
      expect(screen.getByTestId('cs-image-upload-input')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const dropzone = screen.getByTestId('cs-image-upload-dropzone');
      dropzone.focus();

      // Test enter key activation
      await user.keyboard('{Enter}');
      // The file input should be triggered (though we can't test file dialog opening)
    });

    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const fileInput = screen.getByTestId('cs-image-upload-input');
      expect(fileInput).toHaveAttribute('aria-label');
    });
  });

  describe('Error Handling', () => {
    it('should display error messages', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByTestId('cs-image-upload-error')).toBeInTheDocument();
      });
    });

    it('should clear error messages when valid files are uploaded', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      // First upload an invalid file
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByTestId('cs-image-upload-error')).toBeInTheDocument();
      });

      // Then upload a valid file
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      await user.upload(fileInput, validFile);

      await waitFor(() => {
        expect(screen.queryByTestId('cs-image-upload-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Props Handling', () => {
    it('should call onImagesChange when images are added', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              file: expect.any(File),
              preview: expect.any(String),
              status: expect.any(String),
            })
          ])
        );
      });
    });

    it('should call onImagesChange when images are removed', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ImageUpload onImagesChange={mockOnImagesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg', size: 1024 });
      const fileInput = screen.getByTestId('cs-image-upload-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        const deleteButton = screen.getByTestId(/cs-image-delete-/);
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId(/cs-image-delete-/);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith([]);
      });
    });
  });
});