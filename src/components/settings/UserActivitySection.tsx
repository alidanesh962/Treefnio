    // src/components/settings/UserActivitySection.tsx
    import React from 'react';
    import type { IUser } from '../../models/User';
    
    interface UserActivitySectionProps {
      users: IUser[];
    }
    
    const UserActivitySection: React.FC<UserActivitySectionProps> = ({ users }) => {
      return (
        <div>
          {/* Your implementation */}
        </div>
      );
    };
    
    export default UserActivitySection;