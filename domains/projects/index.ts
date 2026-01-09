import { createDomain } from "@/lib/domain";
import { processProject } from "./action";
import {
  type FieldName,
  fieldNames,
  type Operation,
  operations,
  ProjectSchema,
} from "./schema";

export const projectDomain = createDomain<
  FieldName,
  Operation,
  typeof ProjectSchema
>({
  name: "project",
  action: processProject,
  schema: ProjectSchema,

  fields: {
    name: {
      label: "Name",
      type: "text",
      placeholder: "Project name",
    },
    description: {
      label: "Description",
      type: "text",
      placeholder: "Optional description",
    },
  },

  operations: {
    create: {
      label: "Create Project",
      description: "Add a new project to your organization.",
      icon: "plus-circle",
      fields: ["name", "description"],
      submit: { label: "Create", pending: "Creating..." },
    },
    list: {
      label: "Projects",
      description: "List all projects in this organization.",
      icon: "list",
      fields: [],
      submit: { label: "Refresh", pending: "Loading..." },
    },
    update: {
      label: "Edit Project",
      description: "Update project details.",
      icon: "pencil",
      fields: ["name", "description"],
      submit: { label: "Save", pending: "Saving..." },
    },
    delete: {
      label: "Delete Project",
      description: "This action cannot be undone.",
      icon: "trash-2",
      fields: [],
      submit: { label: "Delete", pending: "Deleting..." },
    },
  },
});

export { processProject };
export type { FieldName, Operation };
export { fieldNames, operations };
export type ProjectDomain = typeof projectDomain;
