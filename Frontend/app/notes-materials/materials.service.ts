import { API_ENDPOINTS } from '@/config/apiConfig';

export interface Material {
  id: string;
  topic_id: string;
  file_name: string;
  uploaded_file: string;
  file_type: 'pdf' | 'image' | 'ppt' | 'docx';
  file_size: number;
  createdAt: string;
  updatedAt: string;
  topic?: {
    id: string;
    title: string;
  };
  fileUrl: string;
}

export const getAllMaterials = async (): Promise<Material[]> => {
  try {
    let token = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }
    
    if (!token) {
      throw new Error('Authentication required to fetch materials');
    }
    
    const response = await fetch(API_ENDPOINTS.MATERIALS.LIST, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch materials');
    }

    return await response.json();
  } catch (error) {
    console.error('[LOG materials_service] ========= Error fetching materials:', error);
    throw error;
  }
};

export const getMaterialsByTopic = async (topicId: string): Promise<Material[]> => {
  try {
    let token = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }
    
    if (!token) {
      throw new Error('Authentication required to fetch materials');
    }
    
    const response = await fetch(API_ENDPOINTS.MATERIALS.BY_TOPIC(topicId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch materials for topic: ${topicId}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[LOG materials_service] ========= Error fetching materials by topic:', error);
    throw error;
  }
};

export const uploadMaterial = async (file: File, topicId: string): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicId', topicId);
    
    let token = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }
    
    if (!token) {
      throw new Error('Authentication required to upload materials');
    }

    const response = await fetch(API_ENDPOINTS.MATERIALS.UPLOAD, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload material');
    }

    return await response.json();
  } catch (error) {
    console.error('[LOG materials_service] ========= Error uploading material:', error);
    throw error;
  }
};

export const deleteMaterial = async (materialId: string): Promise<any> => {
  try {
    let token = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }
    
    if (!token) {
      throw new Error('Authentication required to delete materials');
    }
    
    const response = await fetch(`${API_ENDPOINTS.MATERIALS.LIST}/${materialId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete material');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[LOG materials_service] ========= Error deleting material:', error);
    throw error;
  }
};

export const deleteAllMaterialsByTopic = async (topicId: string): Promise<any> => {
  try {
    let token = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }
    
    if (!token) {
      throw new Error('Authentication required to delete materials');
    }
    
    const response = await fetch(API_ENDPOINTS.MATERIALS.BY_TOPIC(topicId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete all materials for topic');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[LOG materials_service] ========= Error deleting materials by topic:', error);
    throw error;
  }
}; 