import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormDescription,
  FormControl,
  FormLabel,
  FormItem,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { GraduationCap, Users, Briefcase } from "lucide-react";
import Layout from "../../components/layout";
import { validateInternshipForm } from "@/lib/validations";
import { useNavigate } from "react-router";
import { useAuth, useClient } from "@/lib/dataContext";
import { useDirectoryData } from "@/hooks/use-directory-data";
import { collection } from "@/lib/directory-utils";
import { internshipPayload, savedResource } from "@/lib/resource-payloads";
import { Link } from "react-router";
import toast from "react-hot-toast";

export default function CreateInternships() {
  const navigate = useNavigate();
  const { currentUser, token } = useAuth();
  const { client } = useClient();
  const companies = useDirectoryData(async () => collection(await client.companies.fetchAll()), token);
  const internshipForm = useForm({
    resolver: yupResolver(validateInternshipForm),
    defaultValues: {
      name: "",
      position: "",
      salary: "",
      requirements: "",
      responsibility: "",
      details: "",
      applicationDeadline: "",
      tags: "",
    },
  });

  const onSubmit = async (data) => {
    internshipForm.clearErrors('root.server');
    try {
      savedResource(await client.internships.create(internshipPayload(data)));
      toast.success('Internship created successfully.');
      navigate('/admin/view-internships');
    } catch (error) {
      internshipForm.setError('root.server', { type: 'server', message: error.message || 'Unable to create internship.' });
    }
  };

  return (
    <>
      {currentUser ? (
        <Layout user={currentUser}>
          <Topbar
            title="Create New Internship"
            mode="form"
            actions={<Button type="submit" form="create-internship-form" disabled={internshipForm.formState.isSubmitting || companies.loading || Boolean(companies.error) || !companies.data.length} className="bg-logo text-white hover:bg-logo/90">{internshipForm.formState.isSubmitting ? 'Saving…' : 'Create internship'}</Button>}
          />
          {companies.error && <div role="alert" className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">{companies.error}<button type="button" onClick={companies.refresh} className="ml-3 font-semibold underline">Try again</button></div>}
          {!companies.loading && !companies.error && !companies.data.length && <p role="status" className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800">Add a company before creating an internship. <Link to="/admin/create-companies" className="font-semibold underline">Add company</Link></p>}
          <div className="crm-form-panel">
            <div className="crm-form-heading"><h2>Opportunity details</h2><p>Describe the role, compensation, required skills, and application deadline.</p></div>
            <Form {...internshipForm}>
              <form
                id="create-internship-form"
                onSubmit={internshipForm.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <fieldset disabled={internshipForm.formState.isSubmitting || companies.loading || Boolean(companies.error) || !companies.data.length} className="space-y-6">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  <FormField
                    control={internshipForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company *</FormLabel>
                        <FormControl>
                          <select {...field} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100">
                            <option value="" disabled>{companies.loading ? 'Loading companies…' : 'Select a company'}</option>
                            {companies.data.map(company => <option key={company._id} value={company._id}>{company.name}</option>)}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={internshipForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position </FormLabel>
                        <FormControl>
                          <Input placeholder="Position" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={internshipForm.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Salary of the position"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={internshipForm.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requirements</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Requirements for the role"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={internshipForm.control}
                    name="responsibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsibility</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Responsibilities of the role"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={internshipForm.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Details about the internship"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={internshipForm.control}
                    name="applicationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Deadline</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            placeholder="Application Deadline"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={internshipForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Tags (comma separated)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Separate tags with commas (e.g., "React, JavaScript,
                          Frontend")
                        </FormDescription>
                        {field.value && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {field.value.split(",").map((tag, index) => {
                              const trimmedTag = tag.trim();
                              return trimmedTag ? (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {trimmedTag}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                </fieldset>
                {internshipForm.formState.errors.root?.server && <p role="alert" className="text-sm text-destructive">{internshipForm.formState.errors.root.server.message}</p>}
              </form>
            </Form>
          </div>
        </Layout>
      ) : (
        <div></div>
      )}
    </>
  );
}
